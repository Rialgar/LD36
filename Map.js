define(['Tile'], function(Tile){
    'use strict';

    function Map(width, height) {
        this.width = width;
        this.height = height;
        this.reset();
    }

    Map.prototype.reset = function(){
        this.tiles = [];
        for (var x = 0; x < this.width; x++) {
            this.tiles[x] = [];
            for (var y = 0; y < this.height; y++) {
                this.tiles[x][y] = new Tile();
            }
        }

        this.flowTile = new Tile('source');
        this.flowTile.setFlowIn(4, 'water');
        this.flowLevel = 0;
        this.flowType = 'water';
        var sx = Math.floor(Math.random()*this.width);
        var sy = 1+Math.floor(Math.random()*(this.height-1));
        this.tiles[sx][sy] = this.flowTile;
        this.flowX = sx;
        this.flowY = sy;

        var cx = sx;
        var cy = sy;
        while(Math.abs(sx-cx) < 2 && Math.abs(sy-cy) < 2){
            cx = 1+Math.floor(Math.random()*(this.width-2));
            cy = Math.floor(Math.random()*(this.height));
        }
        this.tiles[cx][cy] = new Tile('cauldron');

        var gx = sx;
        var gy = sy;
        while(
            (Math.abs(sx-gx) < 2 && Math.abs(sy-gy) < 2) ||
            (Math.abs(cx-gx) < 2 && Math.abs(cy-gy) < 2)
        ){
            gx = Math.floor(Math.random()*this.width);
            gy = Math.floor(Math.random()*(this.height-1));
        }
        this.tiles[gx][gy] = new Tile('goal');

        var freeTiles = [];
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if(
                    (Math.abs(sx-x) > 1 || Math.abs(sy-y) > 1) &&
                    (Math.abs(cx-x) > 1 || Math.abs(cy-y) > 1) &&
                    (Math.abs(gx-x) > 1 || Math.abs(gy-y) > 1)
                ){
                    freeTiles.push({x:x, y:y});
                }
            }
        }
        for(var i = 0; i < 6 && freeTiles.length > 0; i++){
            var coords = freeTiles[Math.floor(Math.random()*freeTiles.length)];
            this.tiles[coords.x][coords.y] = Tile.getRandom();
            this.tiles[coords.x][coords.y].irreplaceable = true;
            freeTiles = freeTiles.filter(function(c){
                return Math.abs(coords.x - c.x) > 1 || Math.abs(coords.y - c.y) > 1;
            });
        }
    };

    Map.prototype.getTile = function(x, y){
        if(x < 0 || x >= this.width || y < 0 || y >= this.height){
            return;
        }
        return this.tiles[x][y];
    };

    Map.prototype.setTile = function(x, y, tile){
        if(x < 0 || x >= this.width || y < 0 || y >= this.height){
            return;
        }
        if(!this.tiles[x][y].isIrreplaceable()){
            this.tiles[x][y] = tile;
        }
    };

    Map.prototype.update = function(millis){
        var out = {event: false, flow:0};
        if(this.flowTile){
            out.flow = millis/2000;
            var remainder = this.flowTile.addFlow(millis/2000, this.flowLevel);
            if(remainder > 0){
                if(this.flowTile.isGoal){
                    out.event = 'win';
                    return out;
                }
                out.tileFilled = true;
                if(this.flowTile.isCauldron){
                    this.flowType = 'steam';
                }
                var dir = this.flowTile.getFlowOut(this.flowLevel);
                var oppositeDir = Tile.getOppositeDirection(dir);
                var delta = Tile.directionToDelta(dir);
                var otherTile = this.getTile(this.flowX + delta.x, this.flowY + delta.y);
                if(!otherTile || !otherTile.hasInput(oppositeDir, this.flowType)){
                    delete this.flowTile;
                    delete this.flowX;
                    delete this.flowY;
                    out.event = this.flowType + 'Spill';
                } else {
                    this.flowTile = otherTile;
                    this.flowX = this.flowX + delta.x;
                    this.flowY = this.flowY + delta.y;
                    this.flowLevel = this.flowTile.setFlowIn(oppositeDir, this.flowType);
                    this.flowTile.addFlow(remainder, this.flowLevel);
                }
            }
        }
        return out;
    };

    return Map;
});