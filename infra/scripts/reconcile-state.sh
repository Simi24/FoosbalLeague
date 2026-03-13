#!/usr/bin/env bash
# reconcile-state.sh
# Imports existing AWS resources into Terraform state when they exist but aren't tracked.
# Safe to run on every deploy — skips resources already in state or not yet created.

set -euo pipefail

ENV="${1:?Usage: $0 <environment> <image_tag>}"
TAG="${2:?Usage: $0 <environment> <image_tag>}"
PROJECT="foosball-league"
REGION="eu-west-1"
TF_ARGS="-var-file=envs/${ENV}/terraform.tfvars -var=image_tag=${TAG}"

import_resource() {
  local addr="$1"
  local id="$2"
  echo -n "  ${addr} ... "
  if terraform import ${TF_ARGS} "${addr}" "${id}" &>/dev/null; then
    echo "imported"
  else
    echo "skipped"
  fi
}

echo "=== Reconciling Terraform state with AWS ==="

# --- DynamoDB ---
import_resource "module.dynamodb.aws_dynamodb_table.main" "${PROJECT}-${ENV}"

# --- Lambda IAM ---
import_resource "module.lambda.aws_iam_role.lambda" "${PROJECT}-${ENV}-lambda"
import_resource "module.lambda.aws_iam_role_policy.dynamodb" "${PROJECT}-${ENV}-lambda:dynamodb-access"
import_resource "module.lambda.aws_iam_role_policy_attachment.logs" \
  "${PROJECT}-${ENV}-lambda/arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

# --- Lambda function ---
import_resource "module.lambda.aws_lambda_function.main" "${PROJECT}-${ENV}"

# --- S3 Frontend ---
BUCKET="${PROJECT}-${ENV}-frontend"
import_resource "module.s3_frontend.aws_s3_bucket.frontend" "${BUCKET}"
import_resource "module.s3_frontend.aws_s3_bucket_website_configuration.frontend" "${BUCKET}"
import_resource "module.s3_frontend.aws_s3_bucket_public_access_block.frontend" "${BUCKET}"
import_resource "module.s3_frontend.aws_s3_bucket_policy.frontend" "${BUCKET}"

# CloudFront OAI (AWS-generated ID, lookup by comment)
OAI_ID=$(aws cloudfront list-cloud-front-origin-access-identities \
  --query "CloudFrontOriginAccessIdentityList.Items[?Comment=='${PROJECT}-${ENV}'].Id | [0]" \
  --output text 2>/dev/null || echo "")
if [[ -n "${OAI_ID}" && "${OAI_ID}" != "None" ]]; then
  import_resource "module.s3_frontend.aws_cloudfront_origin_access_identity.frontend" "${OAI_ID}"

  # CloudFront distribution (lookup by OAI)
  CF_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Origins.Items[?S3OriginConfig.OriginAccessIdentity=='origin-access-identity/cloudfront/${OAI_ID}']].Id | [0]" \
    --output text 2>/dev/null || echo "")
  if [[ -n "${CF_ID}" && "${CF_ID}" != "None" ]]; then
    import_resource "module.s3_frontend.aws_cloudfront_distribution.frontend" "${CF_ID}"
  fi
fi

# --- Cognito ---
POOL_ID=$(aws cognito-idp list-user-pools --max-results 60 \
  --query "UserPools[?Name=='${PROJECT}-${ENV}'].Id | [0]" \
  --output text --region "${REGION}" 2>/dev/null || echo "")
if [[ -n "${POOL_ID}" && "${POOL_ID}" != "None" ]]; then
  import_resource "module.cognito.aws_cognito_user_pool.main" "${POOL_ID}"

  CLIENT_ID=$(aws cognito-idp list-user-pool-clients --user-pool-id "${POOL_ID}" \
    --query "UserPoolClients[?ClientName=='${PROJECT}-${ENV}-web'].ClientId | [0]" \
    --output text --region "${REGION}" 2>/dev/null || echo "")
  if [[ -n "${CLIENT_ID}" && "${CLIENT_ID}" != "None" ]]; then
    import_resource "module.cognito.aws_cognito_user_pool_client.web" "${POOL_ID}/${CLIENT_ID}"
  fi
fi

# --- API Gateway ---
API_ID=$(aws apigatewayv2 get-apis \
  --query "Items[?Name=='${PROJECT}-${ENV}'].ApiId | [0]" \
  --output text --region "${REGION}" 2>/dev/null || echo "")
if [[ -n "${API_ID}" && "${API_ID}" != "None" ]]; then
  import_resource "module.api_gateway.aws_apigatewayv2_api.main" "${API_ID}"
  import_resource "module.api_gateway.aws_apigatewayv2_stage.main" "${API_ID}/${ENV}"

  INT_ID=$(aws apigatewayv2 get-integrations --api-id "${API_ID}" \
    --query "Items[0].IntegrationId" --output text --region "${REGION}" 2>/dev/null || echo "")
  if [[ -n "${INT_ID}" && "${INT_ID}" != "None" ]]; then
    import_resource "module.api_gateway.aws_apigatewayv2_integration.lambda" "${API_ID}/${INT_ID}"
  fi

  AUTH_ID=$(aws apigatewayv2 get-authorizers --api-id "${API_ID}" \
    --query "Items[0].AuthorizerId" --output text --region "${REGION}" 2>/dev/null || echo "")
  if [[ -n "${AUTH_ID}" && "${AUTH_ID}" != "None" ]]; then
    import_resource "module.api_gateway.aws_apigatewayv2_authorizer.cognito" "${API_ID}/${AUTH_ID}"
  fi

  # Routes
  while IFS=$'\t' read -r route_key route_id; do
    [[ -z "${route_key}" ]] && continue
    case "${route_key}" in
      "ANY /{proxy+}") import_resource "module.api_gateway.aws_apigatewayv2_route.proxy" "${API_ID}/${route_id}" ;;
      "ANY /") import_resource "module.api_gateway.aws_apigatewayv2_route.root" "${API_ID}/${route_id}" ;;
      "OPTIONS /{proxy+}") import_resource "module.api_gateway.aws_apigatewayv2_route.options_proxy" "${API_ID}/${route_id}" ;;
      "OPTIONS /") import_resource "module.api_gateway.aws_apigatewayv2_route.options_root" "${API_ID}/${route_id}" ;;
    esac
  done < <(aws apigatewayv2 get-routes --api-id "${API_ID}" \
    --query "Items[*].[RouteKey,RouteId]" --output text --region "${REGION}" 2>/dev/null || echo "")

  # Lambda permission (predictable statement_id)
  import_resource "module.api_gateway.aws_lambda_permission.apigw" "${PROJECT}-${ENV}/AllowAPIGateway"
fi

echo "=== Reconciliation complete ==="
