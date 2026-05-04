variable "environment" { type = string }
variable "project" { type = string }
variable "image_tag" { type = string }
variable "table_arn" { type = string }
variable "table_name" { type = string }
variable "allowed_origins" { type = string }

data "aws_ecr_repository" "main" {
  name = var.project
}

resource "aws_iam_role" "lambda" {
  name = "${var.project}-${var.environment}-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "dynamodb" {
  name = "dynamodb-access"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
      ]
      Resource = [
        var.table_arn,
        "${var.table_arn}/index/*",
      ]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "logs" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.project}-${var.environment}"
  retention_in_days = 14
}

resource "aws_lambda_function" "main" {
  function_name = "${var.project}-${var.environment}"
  role          = aws_iam_role.lambda.arn
  package_type  = "Image"
  image_uri     = "${data.aws_ecr_repository.main.repository_url}:${var.image_tag}"
  architectures = ["arm64"]
  timeout       = 300
  memory_size   = 512

  environment {
    variables = {
      APP_NAME        = var.project
      ENV             = var.environment
      CLOUD_ENV       = var.environment
      DYNAMODB_TABLE  = var.table_name
      ALLOWED_ORIGINS = var.allowed_origins
    }
  }

  lifecycle {
    ignore_changes = [image_uri]
  }
}

output "invoke_arn" {
  value = aws_lambda_function.main.invoke_arn
}

output "function_name" {
  value = aws_lambda_function.main.function_name
}
