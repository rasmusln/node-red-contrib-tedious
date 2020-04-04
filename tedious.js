module.exports = function (RED) {
    const Repository = require('./repository.js').Repository;
    const createConfig = require('./repository.js').createConfig;

    function Tedious (config) {
        RED.nodes.createNode(this, config);

        let node = this;

        var nodeStatus = { fill: null, shape: null, text: null };
        let setNodeStatus = (fill, shape, text) => {
            nodeStatus = { 
                fill: fill || nodeStatus.status, 
                shape : shape || nodeStatus.shape, 
                text: text || nodeStatus.text 
            };
            node.status(nodeStatus);
        }
        
        this.connection = RED.nodes.getNode(config.connection);
        console.log(this.connection);
        if (!this.connection) {
            setNodeStatus("red", "ring", "no connection"); 
        }

        let repositoryConfig = createConfig(
            this.connection.server,
            this.connection.username, 
            this.connection.password);


        let repository = new Repository(repositoryConfig, node, config.rowByRow);

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
            }, (err, rows) => {
                if (err) {
                    node.error("Failed to query \n" + err.toString());
                    setNodeStatus(null, null, "Failed to send");
                } else if (rows != undefined && rows != null) {
                    msg.payload = rows;
                    send(msg);
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
    
    RED.nodes.registerType("tedious", Tedious);
}
