roarwards
=========

test2

### Running subgraph on m1

```
screen
ipfs daemon

# create another postgres db
createdb graph-node2

./target/debug/graph-node \
  --postgres-url postgresql://postgres:@localhost:5432/graph-node2 \
  --ethereum-rpc mainnet:https://mainnet.infura.io/v3/ec948dd1e419466ab5f9600ccabfbfc3 \
  --ipfs 127.0.0.1:5001


NETWORK=mainnet npm run codegen
NETWORK=mainnet npm run create-local
NETWORK=mainnet npm run deploy-local
```

- setup database
- create database schema
