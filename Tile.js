define([], function(){
    var directions = {
        TOP: 0,
        LEFT: 1,
        BOTTOM: 2,
        RIGHT: 3,
        NOWHERE: 4
    };

    var tileSpecs = {
        topLeft: {
            tx: 2,
            ty: 1,
            connections: [[directions.LEFT, directions.TOP]]
        },
        topBottom: {
            tx: 0,
            ty: 2,
            connections: [[directions.TOP, directions.BOTTOM]]
        },
        topRight: {
            tx: 0,
            ty: 1,
            connections: [[directions.TOP, directions.RIGHT]]
        },
        bottomLeft: {
            tx: 2,
            ty: 3,
            connections: [[directions.BOTTOM, directions.LEFT]]
        },
        bottomRight: {
            tx: 0,
            ty: 3,
            connections: [[directions.RIGHT, directions.BOTTOM]]
        },
        leftRight: {
            tx: 1,
            ty: 1,
            connections: [[directions.LEFT, directions.RIGHT]]
        },
        crossing: {
            tx: 3,
            ty: 3,
            connections: [
                [directions.TOP, directions.BOTTOM],
                [directions.LEFT, directions.RIGHT]
            ]
        },
        source: {
            tx: 2,
            ty: 2,
            connections: [[directions.NOWHERE, directions.BOTTOM]],
            special: true,
            flowFactor: 0.1,
            oneWay: true
        },
        cauldron: {
            tx: 1,
            ty: 2,
            connections: [[directions.LEFT, directions.RIGHT]],
            special: true,
            flowFactor: 0.1,
            isCauldron: true
        },
        goal: {
            tx: 1,
            ty: 3,
            connections: [[directions.TOP, directions.NOWHERE]],
            special: true,
            oneWay: true,
            isGoal: true
        },
        empty: {
            tx: 0,
            ty: 0,
            connections: [],
            special: true
        }
    };

    var specNames = Object.keys(tileSpecs);
    var randomNames = specNames.filter(function(name){
        return !tileSpecs[name].special;
    });

    function Tile(specName){
        var spec = tileSpecs[specName];
        if(!spec){
            spec = tileSpecs.empty;
        }

        this.tx = spec.tx;
        this.ty = spec.ty;
        this.connections = spec.connections;
        this.allConnections = spec.connections.reduce(function(all, next){
            return all.concat(next);
        }, []);
        this.fill = this.connections.map(function(){return 0});
        this.flowIn = [];
        this.flowTypes = [];
        this.flowOut = [];
        this.flowFactor = spec.flowFactor || 1;
        this.oneWay = spec.oneWay;
        this.isCauldron = spec.isCauldron;
        this.isGoal = spec.isGoal;
        this.irreplaceable  = ['source', 'cauldron', 'goal'].indexOf(specName) >= 0;
    }

    Tile.prototype.getFillByte = function(level){
        if(level >= this.connections.length){
            return 0;
        }
        var out = Math.round(this.fill[level] * 63);
        var neg = this.connections[level].indexOf(this.flowIn[level]) > 0;
        if(neg){
            out += 64;
        }
        if(this.flowTypes[level] === 'steam' || (this.isCauldron && neg)){
            out += 128;
        }
        return out;
    };

    Tile.prototype.hasFill = function(){
        return this.fill.reduce(function(sum, next){return sum + next}, 0) > 0;
    };

    Tile.prototype.getLevelForConnection = function(dir){
        for (var i = 0; i < this.connections.length; i++) {
            if(this.connections[i].indexOf(dir) >= 0){
                return i;
            }
        }
    };

    Tile.prototype.setFlowIn = function(dir, type){
        if(this.hasInput(dir, type)){
            var level = this.getLevelForConnection(dir);
            this.flowIn[level] = dir;
            this.flowTypes[level] = type;
            var index = this.connections[level].indexOf(dir);
            this.flowOut[level] = this.connections[level][1-index];
            return level;
        }
        throw new Error('There is no input here, idiot!');
    };

    Tile.prototype.getFlowOut = function(level){
        if(level >= this.connections.length){
            return 0;
        }
        return this.flowOut[level];
    };

    Tile.prototype.addFlow = function(amount, level){
        if(level >= this.connections.length){
            return 0;
        }
        this.fill[level] += amount*this.flowFactor;
        if(this.fill[level] > 1.0){
            var remainder = this.fill[level] - 1.0;
            this.fill[level] = 1.0;
            return remainder/this.flowFactor;
        }
        return 0;
    };

    Tile.prototype.getConnections = function(){
        return this.allConnections;
    };

    Tile.prototype.hasInput = function(dir, type){
        if(this.isCauldron && type != 'water'){
            return false;
        }
        if(this.isGoal && type != 'steam'){
            return false;
        }
        var level = this.getLevelForConnection(dir);
        if(typeof level !== 'undefined'){
            if(!this.oneWay || this.connections[level][0] === dir) {
                return typeof this.flowIn[level] === 'undefined' || this.flowIn[level] === dir;
            }
        }
        return false;
    };

    Tile.prototype.isIrreplaceable = function(){
        return this.irreplaceable || this.hasFill();
    };

    Tile.directionToDelta = function(direction){
        switch(direction){
            case directions.TOP:    return {x:  0, y:  1};
            case directions.LEFT:   return {x: -1, y:  0};
            case directions.BOTTOM: return {x:  0, y: -1};
            case directions.RIGHT:  return {x:  1, y:  0};
            default: return {x: 0, y: 0};
        }
    };

    Tile.getOppositeDirection = function(dir){
        return (dir+2)%4;
    };

    Tile.getRandom = function(){
        var specName = randomNames[Math.floor(Math.random()*randomNames.length)];
        return new Tile(specName);
    };

    return Tile;
});