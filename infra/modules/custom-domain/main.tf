terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
    cloudflare = {
      source = "cloudflare/cloudflare"
    }
  }
}

variable "domain_name" { type = string }
variable "cloudflare_zone_id" { type = string }
variable "api_gateway_id" { type = string }
variable "api_gateway_stage_name" { type = string }

locals {
  enabled    = var.domain_name != "" && var.cloudflare_zone_id != ""
  count      = local.enabled ? 1 : 0
  api_domain = "api.${var.domain_name}"
}

resource "aws_acm_certificate" "api" {
  count             = local.count
  domain_name       = local.api_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "cloudflare_record" "api_validation" {
  for_each = local.enabled ? {
    for dvo in aws_acm_certificate.api[0].domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  } : {}

  zone_id = var.cloudflare_zone_id
  name    = each.value.name
  type    = each.value.type
  content = trimsuffix(each.value.value, ".")
  ttl     = 60
  proxied = false
  comment = "ACM DNS validation (API Gateway)"
}

resource "aws_acm_certificate_validation" "api" {
  count                   = local.count
  certificate_arn         = aws_acm_certificate.api[0].arn
  validation_record_fqdns = [for r in cloudflare_record.api_validation : r.hostname]
}

resource "aws_apigatewayv2_domain_name" "api" {
  count       = local.count
  domain_name = local.api_domain

  domain_name_configuration {
    certificate_arn = aws_acm_certificate_validation.api[0].certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "api" {
  count       = local.count
  api_id      = var.api_gateway_id
  domain_name = aws_apigatewayv2_domain_name.api[0].id
  stage       = var.api_gateway_stage_name
}

resource "cloudflare_record" "api" {
  count   = local.count
  zone_id = var.cloudflare_zone_id
  name    = "api"
  type    = "CNAME"
  content = aws_apigatewayv2_domain_name.api[0].domain_name_configuration[0].target_domain_name
  ttl     = 60
  proxied = false
  comment = "API Gateway custom domain — DNS-only (gray cloud)"
}

output "enabled" {
  value = local.enabled
}

output "app_url" {
  value = local.enabled ? "https://${var.domain_name}" : ""
}

output "api_url" {
  value = local.enabled ? "https://${local.api_domain}" : ""
}
