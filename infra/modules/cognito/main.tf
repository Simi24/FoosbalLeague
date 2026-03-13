variable "environment" { type = string }
variable "project" { type = string }

resource "aws_cognito_user_pool" "main" {
  name = "${var.project}-${var.environment}"

  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable             = true
  }

  schema {
    attribute_data_type = "String"
    name                = "tenant_id"
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 64
    }
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "${var.project}-${var.environment}-web"
  user_pool_id = aws_cognito_user_pool.main.id

  supported_identity_providers         = ["COGNITO"]
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  callback_urls = var.environment == "prod" ? [
    "https://foosball.example.com/callback"
  ] : [
    "http://localhost:5173/callback"
  ]

  logout_urls = var.environment == "prod" ? [
    "https://foosball.example.com/logout"
  ] : [
    "http://localhost:5173/logout"
  ]
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project}-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id
}

output "user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "client_id" {
  value = aws_cognito_user_pool_client.web.id
}

output "user_pool_domain" {
  value = aws_cognito_user_pool_domain.main.domain
}
