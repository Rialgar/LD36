require.config({
    paths: {
        text: 'lib/text',
        three: 'lib/three.min'
    }
});

var tileNumber = 8;

require(['Map', 'Tile', 'Renderer'], function(Map, Tile, Renderer){
    'use strict';
    var canvas = document.getElementById('canvas');
    var upcomingList = document.getElementById('upcoming');
    var renderer = new Renderer(canvas, upcomingList, tileNumber, click);

    var map = new Map(tileNumber, tileNumber);
    renderer.setMap(map);

    var upcomingTiles = [];
    for(var tileIndex = 0; tileIndex < tileNumber; tileIndex++) {
        upcomingTiles.push(Tile.getRandom());
    }
    renderer.setUpcomingTiles(upcomingTiles);

    function click(selection){
        var replaced = map.getTile(selection.x, selection.y);
        if(!replaced.isIrreplaceable()) {
            map.setTile(selection.x, selection.y, upcomingTiles.pop());
            upcomingTiles.unshift(Tile.getRandom());
            renderer.setUpcomingOffset(renderer.getUpcomingOffset()+1);
            score -= 100;
        }
    }

    var scoreDisplay = document.getElementById('scores');
    scoreDisplay.style.color = 'white';
    scoreDisplay.style.textAlign = 'center';
    var scoreFigures = [];

    for(var scoreIndex = 0; scoreIndex < 16; scoreIndex++){
        var scoreFigure = document.createElement('div');
        scoreFigure.style.position = 'absolute';
        scoreFigure.style.top = scoreIndex*(100/16) + '%';
        scoreFigure.style.left = '0';
        scoreFigure.style.width = '100%';
        scoreFigure.textContent = 0;
        scoreDisplay.appendChild(scoreFigure);
        scoreFigures.push(scoreFigure);
    }

    function resize(){
        renderer.resize(document.documentElement.clientWidth, document.documentElement.clientHeight);
        scoreDisplay.style.width = renderer.scaledTileSize + 'px';
        scoreDisplay.style.height = tileNumber * renderer.scaledTileSize + 'px';
        scoreDisplay.style.left = (parseInt(canvas.style.left) - renderer.scaledTileSize - 4) + 'px';
        scoreDisplay.style.top = canvas.style.top;
        scoreDisplay.style.lineHeight = (renderer.dim/16) + 'px';
        scoreDisplay.style.fontSize = (renderer.dim/16) + 'px';

        upcomingList.style.width = renderer.scaledTileSize + 'px';
        upcomingList.style.height = tileNumber * renderer.scaledTileSize + 'px';
        upcomingList.style.left = (parseInt(canvas.style.left) + renderer.dim) + 'px';
        upcomingList.style.top = canvas.style.top;
    }
    window.addEventListener('resize', resize);
    resize();


    function showPopup(text, buttons, height, hasInput) {
        paused = true;
        var popup = document.getElementById('popup');
        var popupText = document.getElementById('popupText');
        var popupButtons = popup.getElementsByTagName('button');
        var popupInput = document.getElementById('popupInput');
        popupText.innerHTML = text;
        for (var i = 0; i < popupButtons.length; i++) {
            var button = popupButtons[i];
            if (buttons[i]) {
                button.style.display = 'inline-block';
                button.textContent = buttons[i].text;
                button.onclick = function(b){
                    document.getElementById('popup').style.display = 'none';
                    if(hasInput){
                        b.onClick(popupInput.value);
                    } else {
                        b.onClick();
                    }
                }.bind(this, buttons[i]);
            } else {
                button.style.display = 'none';
            }
        }

        if(hasInput) {
            popupInput.style.display = 'block';
        } else {
            popupInput.style.display = 'none';
        }

        popup.style.display = '-webkit-flex';
        popup.style.display = 'flex';
        popup.style.height = Math.min(height, document.documentElement.clientHeight-200) + 'px';
        popup.style.left = (document.documentElement.clientWidth - 508) / 2 + 'px';
    }

    var score = 0;
    var scoreBeforeLevel = 0;
    function startLevel(){
        scoreBeforeLevel = score;
        map.reset();
        while(upcomingTiles.length > 0){
            upcomingTiles.pop();
        }
        for(var i = 0; i < tileNumber; i++) {
            upcomingTiles.push(Tile.getRandom());
        }
        paused = false;
    }

    function submitScore(tolong){
        showPopup(
            tolong ?
                'Name must be between 1 and 128 characters.' :
                'Enter a name to be used in the scoreboard! Inappropriate names will be removed.',
            [
                {
                    text: 'Send',
                    onClick: function(input){
                        if(input.length === 0 || input.length > 128){
                            submitScore(true);
                        } else {
                            var data = {
                                name: input,
                                score: Math.round(score)
                            };
                            var req = new XMLHttpRequest();
                            req.open('POST', 'https://rialgar.de:8888');
                            req.send(JSON.stringify(data));
                            score = 0;
                            req.onreadystatechange = function(){
                                if(req.readyState === 4){
                                    showHighScore(JSON.parse(req.responseText));
                                }
                            }
                        }
                    }
                },
                {
                    text: 'Cancel and Continue Game',
                    onClick: function(){
                        startLevel();
                    }
                }
            ],
            200,
            true
        );
    }

    function showHighScore(highScore){
        var message = '<table><tr><th>Pos</th><th>Name</th><th>Score</th></tr>';
        for (var boardPosition = 0; boardPosition < highScore.length; boardPosition++) {
            var entry = highScore[boardPosition];
            message = message + '<tr><td>'+(boardPosition+1)+'</td><td>'+entry.name+'</td><td>'+entry.score+'</td></tr>';
        }
        message = message + '</table>';
        showPopup(
            message,
            [{
                text:'OK',
                onClick: function(){
                    startLevel();
                }
            }],
            100 + highScore.length * 32
        )
    }

    var last = -1;
    var won = false;
    var paused = false;
    function update(now){
        var delta = 1;
        if(last >= 0){
            delta = Math.min(100, now - last);
        }
        last = now;
        window.requestAnimationFrame(update);
        if(paused){
            return;
        }
        var result = map.update(delta);

        if(result.tileFilled){
            score += 1000;
        }

        score = score + result.flow*200;

        switch(result.event){
            case 'win':
                showPopup(
                    'Hah, you made it, way to go!. On to the next Job!',
                    [
                        {
                            text: 'Continue',
                            onClick: function(){
                                startLevel();
                            }
                        },
                        {
                            text: 'Submit Score and Reset',
                            onClick: function(){
                                submitScore();
                            }
                        }
                    ],
                    120
                );
                score += 10000;
                break;
            case 'waterSpill':
                score = scoreBeforeLevel;
                showPopup(
                    'What the... There is water everywhere! You will not be payed for this mess!',
                    [
                        {
                            text: 'Continue',
                            onClick: function(){
                                startLevel();
                            }
                        },
                        {
                            text: 'Submit Score and Reset',
                            onClick: function(){
                                submitScore();
                            }
                        }
                    ],
                    120
                );
                break;
            case 'steamSpill':
                score = scoreBeforeLevel;
                showPopup(
                    'Where... ah there you are. The steam is meant to power the mechanism, not fog up the place. There will be no pay for this one!',
                    [
                        {
                            text: 'Continue',
                            onClick: function(){
                                startLevel();
                            }
                        },
                        {
                            text: 'Submit Score and Reset',
                            onClick: function(){
                                submitScore();
                            }
                        }
                    ],
                    140
                );
                break;
        }

        var offset = renderer.getUpcomingOffset();
        if(offset >= 0){
            var offsetDelta = Math.max(offset/10, delta/1000);
            offset = Math.max(0, offset - offsetDelta);
            renderer.setUpcomingOffset(offset);
        }
        renderer.render();

        var scoreText = Math.round(score).toString();
        if(score > Number.MAX_SAFE_INTEGER){
            if(!won) {
                paused = true;
                showPopup('STOP IT! We do not have that much money to pay you.', [], 100);
                won = true;
            }
            scoreText = '9999999999999999';
        }
        for (var i = 0; i < scoreFigures.length; i++) {
            var character = scoreText[scoreText.length - 1 - i];
            if(!character){
                character = '0';
            }
            var scoreFigure = scoreFigures[scoreFigures.length-1-i];
            scoreFigure.textContent = character;
        }
    }
    update(-1);
    showPopup(
        '<p>So you are the new steam architect? Great, the emperor wants these mechanisms powered as soon as possible.</p>' +
        '<p>On the right is your pile of pipes, just click to place the one on top into the grid. You can replace pipes, if they are not yet used. But not pre-placed ones!</p>' +
        '<p>Connect the well to the boiler and the boiler to the mechanics. Be fast, the water is already running.</p>' +
        '<p>On the left is your pay. We like fancy pipework here, longer pipes get you more money. The cost of the pipes however will be deducted.</p>',
        [
            {
                text: 'Begin',
                onClick: function(){
                    paused = false;
                }
            },
            {
                text: 'Show High Score',
                onClick: function(){
                    var req = new XMLHttpRequest();
                    req.open('GET', 'https://rialgar.de:8888');
                    req.send();
                    req.onreadystatechange = function(){
                        if(req.readyState === 4){
                            showHighScore(JSON.parse(req.responseText));
                        }
                    }
                }
            }
        ],
        450
    );
});