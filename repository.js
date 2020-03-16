const EventEmitter = require('events');
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;

function createConfig (server, username, password, port) {
    return config = {
        authentication: {
            type: "default",
            options: {
                userName: username,
                password: password
            }
        },
        server: server,
        options: { port: port || 1433 }
    }
};

class Repository extends EventEmitter {

    constructor(config, logger) {
        super();
        this.config = config;
        this.logger = logger;
        this.client = null;
        this.connected = false;
    }

    get isConnected() {
        return this.connected; 
    }

    connect(callback) {
        this.client = new Connection(this.config);

        this.client.on('connect', (err) => {
            this.logger.log(err);

            if (!err) {
                this.connected = true;
                this.emit("connect");
                callback(err, this.client);
            } else {
                callback(err, null);
            }
        });
    }

    ensureConnected(callback) {
        if (!this.isConnected) {
            this.connect(callback);
        } else {
            callback(null, this.client);
        }
    }

    query(statement, row, done) {
        let request = new Request(statement, (err, rowCount) => {
            this.logger.log(err);
            if (err) {
                done(err);
            }

            this.logger.log(rowCount + 'rows returned');
            done(err);
        });

        request.on('row', (columns) => {
            row(columns);
        });

        request.on('done', () => {
            done();
        });

        this.ensureConnected((err, client) => {
            if (err) {
                done(err);
            } else {
                client.execSql(request);
            }
        });
    }

    close() {
        if (this.client) {
            this.client.close();
            this.client = null;
            this.connected = false;
            this.emit('disconnect');
        }
    }
}

module.exports = {
    Repository: Repository,
    createConfig: createConfig
};