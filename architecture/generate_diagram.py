#!/usr/bin/env python3
"""
AWS DevOps Incident Helper - Architecture Diagram Generator
Using AWS Diagrams (diagrams python package - standard AWS Diagram MCP engine)
"""

import os
from diagrams import Diagram, Cluster, Edge
from diagrams.aws.general import User
from diagrams.aws.mobile import Amplify
from diagrams.aws.network import APIGateway
from diagrams.aws.compute import Lambda
from diagrams.aws.ml import Bedrock
from diagrams.aws.management import Cloudwatch
from diagrams.aws.security import IAMRole

graph_attr = {
    "fontsize": "22",
    "fontname": "Helvetica Neue, Arial, sans-serif",
    "bgcolor": "#ffffff",
    "pad": "0.6",
    "nodesep": "0.6",
    "ranksep": "0.9",
}

node_attr = {
    "fontsize": "12",
    "fontname": "Helvetica Neue, Arial, sans-serif",
}

edge_attr = {
    "fontsize": "10",
    "fontname": "Helvetica Neue, Arial, sans-serif",
}

output_path = os.path.join(os.path.dirname(__file__), "aws_architecture_diagram")

with Diagram(
    "AWS DevOps Incident Helper - Serverless Architecture",
    filename=output_path,
    show=False,
    direction="LR",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):
    user = User("DevOps Engineer\n(Web Browser)")

    with Cluster("AWS Cloud  •  Region: ap-south-1 (Mumbai)"):
        amplify = Amplify("AWS Amplify\n(React 18 + Vite)")
        apigw = APIGateway("API Gateway\n(HTTP API: POST /analyze)")
        
        with Cluster("Serverless Compute"):
            lambda_fn = Lambda("AWS Lambda\n(Python 3.11, 256MB)")
            role = IAMRole("IAM Execution Role\n(Least Privilege)")
            role - Edge(style="dotted", color="#777777") - lambda_fn

        with Cluster("AI & Observability"):
            bedrock = Bedrock("Amazon Bedrock\n(Nova Lite APAC Profile)")
            cloudwatch = Cloudwatch("CloudWatch Logs\n(/aws/lambda/...)")

    user >> Edge(label="1. Visit App", color="#0284c7") >> amplify
    user >> Edge(label="2. POST /analyze", color="#ea580c") >> apigw
    apigw >> Edge(label="3. Lambda Proxy (v2)", color="#ea580c") >> lambda_fn
    lambda_fn >> Edge(label="4. Converse API", color="#059669") >> bedrock
    bedrock >> Edge(label="5. Structured JSON", color="#059669", style="dashed") >> lambda_fn
    lambda_fn >> Edge(label="6. Response", color="#ea580c", style="dashed") >> apigw
    apigw >> Edge(label="7. Render Troubleshooting", color="#0284c7", style="dashed") >> user
    lambda_fn >> Edge(label="Logs & Traces", color="#7c3aed", style="dotted") >> cloudwatch

if __name__ == "__main__":
    print(f"Architecture diagram successfully generated at: {output_path}.png")
