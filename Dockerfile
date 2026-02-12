FROM node:slim

# Install system dependencies required for Rust and wasm-pack
RUN apt-get update && apt-get install -y curl build-essential pkg-config libssl-dev

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install wasm-pack
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# Build the WASM module
# We run this during build to ensure everything is set up, 
RUN npm run build:wasm

EXPOSE 5173

# Start the application in development mode
CMD ["npm", "run", "dev", "--", "--host"]
