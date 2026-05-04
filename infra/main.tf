terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.82"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.40"
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

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      terraform   = "true"
      environment = var.environment
      project     = var.project
      subproject  = var.subproject
    }
  }
}

provider "cloudflare" {}

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

locals {
  public_origin = var.domain_name != "" ? "https://${var.domain_name}" : "https://${module.s3_frontend.cloudfront_domain}"
}

module "lambda" {
  source          = "./modules/lambda"
  environment     = var.environment
  project         = var.project
  image_tag       = var.image_tag
  table_arn       = module.dynamodb.table_arn
  table_name      = module.dynamodb.table_name
  allowed_origins = local.public_origin
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
  allowed_origins      = [local.public_origin]
}

module "s3_frontend" {
  source             = "./modules/s3-frontend"
  environment        = var.environment
  project            = var.project
  domain_name        = var.domain_name
  cloudflare_zone_id = var.cloudflare_zone_id

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
    cloudflare    = cloudflare
  }
}

module "custom_domain" {
  source                 = "./modules/custom-domain"
  domain_name            = var.domain_name
  cloudflare_zone_id     = var.cloudflare_zone_id
  api_gateway_id         = module.api_gateway.api_id
  api_gateway_stage_name = module.api_gateway.stage_name
}

resource "cloudflare_record" "apex" {
  count   = var.domain_name != "" && var.cloudflare_zone_id != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "@"
  type    = "CNAME"
  content = module.s3_frontend.cloudfront_domain
  ttl     = 1
  proxied = true
  comment = "Frontend (CloudFront) — Cloudflare proxy ON"
}
