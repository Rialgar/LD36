uniform vec2 tileNumber;
uniform vec2 tileSize;
uniform vec2 offset;
uniform vec2 wheelRotation;

uniform vec4 selection;

uniform sampler2D pipes;
uniform sampler2D water;
uniform sampler2D steam;
uniform sampler2D tiles;

const vec2 tileMapSize = vec2(4.0, 4.0);

vec4 drawImage(vec2 uv, float fill){
    vec4 color = texture2D(pipes, uv);
    bool isSteam = false;
    bool isBackwards = false;
    if(fill > 127.1/255.0){//steam flag
        fill -= 128.0/255.0;
        isSteam = true;
    }
    if(fill > 63.1/255.0){//reverse flag
        fill -= 64.0/255.0;
        isBackwards = true;
    }
    fill = fill * 255.0/63.0;
    if(fill > 0.0){
        vec4 waterColor;
        if(isSteam){
            waterColor = texture2D(steam, uv);
        } else {
            waterColor = texture2D(water, uv);
        }
        if(waterColor.a > 0.0){
            float alpha = pow(waterColor.a, 0.45);
            if(isBackwards){
                alpha = 1.0 - alpha + 1.0/255.0;
            }
            alpha = smoothstep(alpha-1.0/255.0, alpha, fill);
            color.rgb = mix(color.rgb, waterColor.rgb, alpha);
        }
    }
    return color;
}

void main() {
    vec2 dividedCoordinates = (gl_FragCoord.xy + offset) / tileSize;
    if(
        dividedCoordinates.x < 0.0 || dividedCoordinates.x >= tileNumber.x ||
        dividedCoordinates.y < 0.0 || dividedCoordinates.y >= tileNumber.y
    ){
        gl_FragColor = vec4(0.0);
        return;
    }
	vec2 tileCoordinates = floor(dividedCoordinates);
	vec2 inTileCoordinate = dividedCoordinates - tileCoordinates;

	vec4 tile = texture2D(tiles, tileCoordinates/tileNumber);

    vec2 tileCoords = tile.xy * 255.0;

    bool isFixed = false;
    if(tileCoords.x > 31.0){
        tileCoords.x -= 32.0;
        isFixed = true;
    }

    vec2 uv = (tileCoords + inTileCoordinate) / tileMapSize;
    float fill = tile.z;
    gl_FragColor = drawImage(uv, fill);
    if(tileCoords.x == 3.0 && tileCoords.y == 3.0){
        vec2 uv2 = (vec2(1.0, 1.0) + inTileCoordinate) / tileMapSize;
        float fill2 = tile.w;
        vec4 below = drawImage(uv2, fill2);
        gl_FragColor.rgb = mix(below.rgb, gl_FragColor.rgb, gl_FragColor.a);
    } else if(tileCoords.x == 1.0 && tileCoords.y == 3.0){
        vec2 centeredIntileCoords = inTileCoordinate - 0.5;
        vec2 rotatedIntileCoords = clamp(vec2(
            centeredIntileCoords.x * wheelRotation.y + centeredIntileCoords.y * wheelRotation.x + 0.5,
            centeredIntileCoords.y * wheelRotation.y - centeredIntileCoords.x * wheelRotation.x + 0.5
        ), 0.0, 1.0);

        vec2 uv2 = (vec2(3.0, 1.0) + rotatedIntileCoords) / tileMapSize;
        vec4 wheel = drawImage(uv2, 0.0);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, wheel.rgb, wheel.a);
    }
    if(selection.z != 0.0 && tileCoordinates.xy == selection.xy){
        vec3 highlight = isFixed ? vec3(1.0, 0.3, 0.3) : vec3(1.0);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, highlight , 0.7);
    }
}