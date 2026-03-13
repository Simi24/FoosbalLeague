variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod", "shared"], var.environment)
    error_message = "environment must be one of: dev, staging, prod, shared"
  }
}

variable "project" {
  description = "Top-level project name"
  type        = string
  default     = "foosball-league"
}

variable "subproject" {
  description = "Service or component within the project"
  type        = string
  default     = "api"
}

variable "image_tag" {
  description = "Docker image tag for Lambda deployment"
  type        = string
  default     = "latest"
}
