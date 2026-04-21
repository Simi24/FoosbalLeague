variable "environment" { type = string }
variable "project" { type = string }

resource "aws_dynamodb_table" "main" {
  name         = "${var.project}-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }
  attribute {
    name = "sk"
    type = "S"
  }
  attribute {
    name = "gsi1_pk"
    type = "S"
  }
  attribute {
    name = "gsi1_sk"
    type = "S"
  }
  attribute {
    name = "gsi3_pk"
    type = "S"
  }
  attribute {
    name = "gsi3_sk"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "gsi1_pk"
    range_key       = "gsi1_sk"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "GSI3"
    hash_key        = "gsi3_pk"
    range_key       = "gsi3_sk"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = var.environment == "prod"
  }
}

output "table_arn" {
  value = aws_dynamodb_table.main.arn
}

output "table_name" {
  value = aws_dynamodb_table.main.name
}
