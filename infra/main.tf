terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.82"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      terraform   = "true"
      environment = var.environment
      project     = var.project
      subproject  = var.subproject
    }
  }
}

module "dynamodb" {
  source      = "./modules/dynamodb"
  environment = var.environment
  project     = var.project
}

module "cognito" {
  source      = "./modules/cognito"
  environment = var.environment
  project     = var.project
}

import {
  to = module.lambda.aws_cloudwatch_log_group.lambda
  id = "/aws/lambda/${var.project}-${var.environment}"
}

module "lambda" {
  source          = "./modules/lambda"
  environment     = var.environment
  project         = var.project
  image_tag       = var.image_tag
  table_arn       = module.dynamodb.table_arn
  table_name      = module.dynamodb.table_name
  allowed_origins = "https://${module.s3_frontend.cloudfront_domain}"
}

module "api_gateway" {
  source               = "./modules/api-gateway"
  environment          = var.environment
  project              = var.project
  lambda_invoke_arn    = module.lambda.invoke_arn
  lambda_function_name = module.lambda.function_name
  cognito_user_pool_id = module.cognito.user_pool_id
  cognito_client_id    = module.cognito.client_id
  aws_region           = var.aws_region
  allowed_origins      = ["https://${module.s3_frontend.cloudfront_domain}"]
}

module "s3_frontend" {
  source      = "./modules/s3-frontend"
  environment = var.environment
  project     = var.project
}
