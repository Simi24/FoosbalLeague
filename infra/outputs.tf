output "api_url" {
  description = "API Gateway invoke URL"
  value       = module.api_gateway.api_url
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain for frontend"
  value       = module.s3_frontend.cloudfront_domain
}

output "frontend_bucket" {
  description = "S3 bucket name for frontend assets"
  value       = module.s3_frontend.bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)"
  value       = module.s3_frontend.cloudfront_distribution_id
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = module.cognito.client_id
}
