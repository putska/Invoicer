name: Deploy to Digital Ocean

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v2

      - name: Set up SSH
        uses: webfactory/ssh-agent@v0.7.0
        with:
          ssh-private-key: ${{ secrets.DEPLOY_SSH_KEY }}

      - name: Execute Deployment Script
        run: ssh -o StrictHostKeyChecking=no swatts@209.38.77.21 'bash -s' < /home/swatts/Invoicer/deploy.sh
