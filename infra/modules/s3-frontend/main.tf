terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws.us_east_1]
    }
    cloudflare = {
      source = "cloudflare/cloudflare"
    }
  }
}

variable "environment" { type = string }
variable "project" { type = string }

variable "domain_name" {
  type    = string
  default = ""
}

variable "cloudflare_zone_id" {
  type    = string
  default = ""
}

locals {
  custom_domain_enabled = var.domain_name != "" && var.cloudflare_zone_id != ""
  count                 = local.custom_domain_enabled ? 1 : 0
}

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project}-${var.environment}-frontend"
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_identity" "frontend" {
  comment = "${var.project}-${var.environment}"
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = aws_cloudfront_origin_access_identity.frontend.iam_arn }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.frontend.arn}/*"
    }]
  })
}

resource "aws_acm_certificate" "frontend" {
  count             = local.count
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "cloudflare_record" "frontend_validation" {
  count = local.count

  zone_id = var.cloudflare_zone_id
  name    = tolist(aws_acm_certificate.frontend[0].domain_validation_options)[0].resource_record_name
  type    = tolist(aws_acm_certificate.frontend[0].domain_validation_options)[0].resource_record_type
  content = trimsuffix(tolist(aws_acm_certificate.frontend[0].domain_validation_options)[0].resource_record_value, ".")
  ttl     = 60
  proxied = false
  comment = "ACM DNS validation (CloudFront)"
}

resource "aws_acm_certificate_validation" "frontend" {
  count                   = local.count
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.frontend[0].arn
  validation_record_fqdns = [cloudflare_record.frontend_validation[0].hostname]
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  default_root_object = "index.html"
  aliases             = local.custom_domain_enabled ? [var.domain_name] : []

  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "s3"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3"

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    viewer_protocol_policy = "redirect-to-https"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = local.custom_domain_enabled ? null : true
    acm_certificate_arn            = local.custom_domain_enabled ? aws_acm_certificate_validation.frontend[0].certificate_arn : null
    ssl_support_method             = local.custom_domain_enabled ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"
  }
}

output "bucket_name" {
  value = aws_s3_bucket.frontend.id
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.frontend.domain_name
}
