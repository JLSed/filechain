Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

For dev
rustup component add rust-analyzer
rustup component add rust-src

Run these first:
npm Install
npm run build:wasm
