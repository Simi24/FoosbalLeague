FROM mcr.microsoft.com/vscode/devcontainers/python:3.12

# Install just (task runner)
RUN curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to /usr/local/bin

# Install yarn globally (will be available after node feature installs node)
RUN npm install -g yarn 2>/dev/null || true

# Python dev tools
RUN pip install --no-cache-dir \
    ruff==0.17.3 \
    pytest \
    httpx

WORKDIR /workspace

ARG USERNAME=vscode
RUN SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
    && mkdir /commandhistory \
    && touch /commandhistory/.bash_history \
    && chown -R $USERNAME /commandhistory \
    && echo "$SNIPPET" >> "/home/$USERNAME/.bashrc"