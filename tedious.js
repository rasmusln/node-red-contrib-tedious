module.exports = function (RED) {
    const Repository = require('./repository.js').Repository;
    const createConfig = require('./repository.js').createConfig;

    RED.nodes.registerType("tedious", Tedious, {
        credentials: {
             server: { type: "text" },
             username: { type: "text" },
             password: { type: "password" }
        },
        defaults: {
            name: { value: "tedious" }
        }
    });

    function Tedious (config) {
        RED.nodes.createNode(this, config);

        let node = this;

        let repositoryConfig = createConfig(
            node.credentials.server,
            node.credentials.username, 
            node.credentials.password);

        let repository = new Repository(repositoryConfig, node);

        var nodeStatus = { fill: null, shape: null, text: null };
        let setNodeStatus = (fill, shape, text) => {
            nodeStatus = { 
                fill: fill || nodeStatus.status, 
                shape : shape || nodeStatus.shape, 
                text: text || nodeStatus.text 
            };
            node.status(nodeStatus);
        }

        repository.on('connect', () => {
            setNodeStatus("green", "dot", "connected");
        });
        repository.on('disconnect', () => {
            setNodeStatus("red", "ring", "disconnected");
        });

        node.on('input', function (msg, send, done) {
            if (typeof(msg.payload) !== 'string') {
                msg.payload = msg.payload.toString();
            }

            repository.query(msg.payload, (row) => {
                msg.payload = row;
                send(msg);
            }, (err) => {
                if (err) {
                    node.error("Failed to query \n" + err.toString());
                    setNodeStatus(null, null, "Failed to send");
                }
                done();
            });
        });

        node.on('close', function () {
            if (repository !== null) {
                repository.close();
                repository = null;
            }
        });
    }
}
