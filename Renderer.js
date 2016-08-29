define(['three', 'text!simple.vert', 'text!map.frag'], function(THREE, vertexShader, mapFragmentShader){
    'use strict';

    function Renderer(canvas, upcomingCanvas, tileNumber, onClick){
        this.tileSize = 256;
        this.tileNumber = tileNumber;
        this.pixelCount = this.tileSize*this.tileNumber;

        this.canvas = canvas;

        var scene = new THREE.Scene();
        var camera = new THREE.OrthographicCamera( -1, 1, -1, 1, 0.1, 100);

        var renderer = new THREE.WebGLRenderer({canvas: canvas});
        renderer.setSize( this.pixelCount, this.pixelCount );

        var textureSize = this.tileNumber * this.tileNumber * 4;
        this.tileData = new Uint8Array(textureSize);
        this.tileDataTexture = new THREE.DataTexture(this.tileData, this.tileNumber, this.tileNumber, THREE.RGBAFormat, THREE.UnsignedByteType);
        this.tileDataTexture.minFilter = THREE.NearestFilter;
        this.tileDataTexture.magFilter = THREE.NearestFilter;
        this.tileDataTexture.needsUpdate = true;

        var selection = new THREE.Vector3(0,0,0);

        var loader = new THREE.TextureLoader();
        var pipeTexture = loader.load( "resources/pipes.png" );
        pipeTexture.minFilter = THREE.NearestFilter;
        pipeTexture.magFilter = THREE.NearestFilter;
        var waterTexture = loader.load( "resources/water.png" );
        waterTexture.minFilter = THREE.NearestFilter;
        waterTexture.magFilter = THREE.NearestFilter;
        var steamTexture = loader.load( "resources/steam.png" );
        steamTexture.minFilter = THREE.NearestFilter;
        steamTexture.magFilter = THREE.NearestFilter;

        this.wheelRotation = new THREE.Vector2(0, 1);

        var geometry = new THREE.PlaneBufferGeometry(2, 2);
        var uniforms = {
            tileNumber: { value: new THREE.Vector2(this.tileNumber, this.tileNumber) },
            tileSize: { value: new THREE.Vector2(this.tileSize, this.tileSize) },
            selection: {value: selection},
            pipes: { value:  pipeTexture},
            water: { value:  waterTexture},
            steam: { value:  steamTexture},
            tiles: { value: this.tileDataTexture },
            offset: { value: new THREE.Vector2(0,0) },
            wheelRotation: { value: this.wheelRotation}
        };
        var material = new THREE.ShaderMaterial( {
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: mapFragmentShader
        } );
        var plane = new THREE.Mesh( geometry, material );
        scene.add( plane );

        camera.position.z = 1;
        camera.lookAt(new THREE.Vector3(0,0,0));

        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        var upcomingScene = new THREE.Scene();
        var upcomingCamera = new THREE.OrthographicCamera( -1, 1, -this.tileNumber, this.tileNumber, 0.1, 100);

        var upcomingRenderer = new THREE.WebGLRenderer({canvas: upcomingCanvas});
        upcomingRenderer.setSize( this.tileSize, this.pixelCount );

        var upcomingTextureSize = (this.tileNumber) * 4;
        this.upcomingTileData = new Uint8Array(upcomingTextureSize);
        this.upcomingTileDataTexture = new THREE.DataTexture(this.upcomingTileData, 1, this.tileNumber, THREE.RGBAFormat, THREE.UnsignedByteType);
        this.upcomingTileDataTexture.minFilter = THREE.NearestFilter;
        this.upcomingTileDataTexture.magFilter = THREE.NearestFilter;
        this.upcomingTileDataTexture.needsUpdate = true;

        this.upcomingOffset = new THREE.Vector2(0, 0);

        var upcomingGeometry = new THREE.PlaneBufferGeometry(2, 2*this.tileNumber);
        var upcomingUniforms = {
            tileNumber: { value: new THREE.Vector2(1, this.tileNumber) },
            tileSize: { value: new THREE.Vector2(this.tileSize, this.tileSize) },
            selection: {value: new THREE.Vector3()},
            pipes: { value:  pipeTexture},
            water: { value:  waterTexture},
            steam: { value:  steamTexture},
            tiles: { value: this.upcomingTileDataTexture },
            offset: { value: this.upcomingOffset }
        };
        var upcomingMaterial = new THREE.ShaderMaterial( {
            uniforms: upcomingUniforms,
            vertexShader: vertexShader,
            fragmentShader: mapFragmentShader
        } );
        var upcomingPlane = new THREE.Mesh( upcomingGeometry, upcomingMaterial );
        upcomingScene.add( upcomingPlane );

        upcomingCamera.position.z = 1;
        upcomingCamera.lookAt(new THREE.Vector3(0,0,0));

        this.upcomingRenderer = upcomingRenderer;
        this.upcomingScene = upcomingScene;
        this.upcomingCamera = upcomingCamera;

        this.offset = new THREE.Vector2();
        this.resize(this.pixelCount, this.pixelCount);

        var self = this;
        function mouseMove(ev){
            selection.x = Math.floor((ev.clientX - self.offset.x) * self.tileNumber/self.dim);
            selection.y = self.tileNumber - 1 - Math.floor((ev.clientY - self.offset.y) * self.tileNumber/self.dim);
        }

        canvas.addEventListener('mouseenter', function(ev){
            selection.z = 1;
            mouseMove(ev);
        });
        canvas.addEventListener('mouseleave', function(){
            selection.z = 0;
        });
        canvas.addEventListener('mousemove', mouseMove);
        canvas.addEventListener('click', function(ev){
            mouseMove(ev);
            onClick(selection);
        });
    }

    Renderer.prototype.resize = function(maxWidth, maxHeight){
        var dim = Math.min(maxHeight, (maxWidth-12)*this.tileNumber/(this.tileNumber+2)+4);
        dim -= (maxWidth-dim)%2;

        this.canvas.style.width = (dim-4) + 'px';
        this.canvas.style.height = (dim-4) + 'px';
        this.offset.x = Math.floor((maxWidth - dim)/2);
        this.offset.y = Math.floor((maxHeight - dim)/2);
        this.canvas.style.left = this.offset.x + 'px';
        this.canvas.style.top = this.offset.y + 'px';

        this.dim = dim;
        this.scaledTileSize = this.tileSize * (dim-4)/this.pixelCount;
    };

    Renderer.prototype.setMap = function(map){
        this.map = map;
    };

    Renderer.prototype.setUpcomingTiles = function(upcomingTiles){
        this.upcomingTiles = upcomingTiles;
    };
    Renderer.prototype.setUpcomingOffset = function(y){
        this.upcomingOffset.y = y * this.tileSize;
    };
    Renderer.prototype.getUpcomingOffset = function(){
        return this.upcomingOffset.y/this.tileSize;
    };

    Renderer.prototype.render = function(){
        for (var x = 0; x < this.tileNumber; x++) {
            for (var y = 0; y < this.tileNumber; y++) {
                var tile = this.map.getTile(x, y);
                this.tileData[(y * this.tileNumber + x)*4    ] = tile.tx + (tile.isIrreplaceable() ? 32 : 0);
                this.tileData[(y * this.tileNumber + x)*4 + 1] = tile.ty;
                this.tileData[(y * this.tileNumber + x)*4 + 2] = tile.getFillByte(0);
                this.tileData[(y * this.tileNumber + x)*4 + 3] = tile.getFillByte(1);
                if(tile.isGoal){
                    var angle = Math.PI*2*tile.fill[0];
                    this.wheelRotation.x = Math.sin(angle);
                    this.wheelRotation.y = Math.cos(angle);
                }
            }
        }
        this.tileDataTexture.needsUpdate = true;

        for (y = 0; y < this.tileNumber; y++) {
            tile = this.upcomingTiles[y];
            this.upcomingTileData[y *4    ] = tile.tx;
            this.upcomingTileData[y *4 + 1] = tile.ty;
            this.upcomingTileData[y *4 + 2] = 0;
            this.upcomingTileData[y *4 + 3] = 0;
        }
        this.upcomingTileDataTexture.needsUpdate = true;

        this.renderer.render(this.scene, this.camera);
        this.upcomingRenderer.render(this.upcomingScene, this.upcomingCamera);
    };

    return Renderer;
});