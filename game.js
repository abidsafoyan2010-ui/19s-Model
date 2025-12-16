// ====== SAVE / LOAD ======
function loadData(){
    let d = localStorage.getItem("model19");
    return d ? JSON.parse(d) : {
        level:1, xp:0, nextXP:100, coin:0, speed:4
    };
}
function saveData(data){
    localStorage.setItem("model19", JSON.stringify(data));
}

// ====== LOBBY ======
class Lobby extends Phaser.Scene {
    constructor(){ super("Lobby"); }
    create(){
        this.player = loadData();
        this.cameras.main.setBackgroundColor("#111");

        this.add.text(400,60,"🏎️ 19S MODEL 🏁",{fontSize:"42px",fill:"#fff"}).setOrigin(0.5);
        this.add.text(400,140,
`⭐ Level: ${this.player.level}
⚡ Speed: ${this.player.speed.toFixed(1)}
🪙 Coin: ${this.player.coin}
🎯 XP: ${this.player.xp}/${this.player.nextXP}`,
        {fontSize:"22px",fill:"#0f0",align:"center"}).setOrigin(0.5);

        this.add.text(400,260,
`🎮 Control
⬆️ Speed   ⬇️ Brake 💨
⬅️ ➡️ Turn
⏸️ P = Pause`,
        {fontSize:"18px",fill:"#fff",align:"center"}).setOrigin(0.5);

        let play = this.add.text(400,380,"▶️ PLAY",
            {fontSize:"32px",fill:"#ff0",backgroundColor:"#333",padding:10}
        ).setOrigin(0.5).setInteractive();

        play.on("pointerdown",()=>{
            this.scene.start("Race",{player:this.player});
        });
    }
}

// ====== RACE ======
class Race extends Phaser.Scene {
    constructor(){ super("Race"); }
    init(data){ this.player = data.player; }

    create(){
        this.cameras.main.setBackgroundColor("#222");

        this.speed = 0;
        this.maxSpeed = this.player.speed + 2;
        this.paused = false;

        this.distance = 0;
        this.finish = 200;

        // Car
        this.car = this.add.rectangle(400,460,60,100,0x00ffcc);
        this.car.angle = 0;
        this.carEmoji = this.add.text(this.car.x,this.car.y,"🏎️",{fontSize:"48px"}).setOrigin(0.5);

        // Obstacle
        this.obs = this.add.rectangle(400,-50,60,80,0xff4444);
        this.obsEmoji = this.add.text(this.obs.x,this.obs.y,"🪨",{fontSize:"48px"}).setOrigin(0.5);

        // Emoji effects
        this.fog = this.add.text(400,520,"",{fontSize:"32px"}).setOrigin(0.5);
        this.fire = this.add.text(400,300,"",{fontSize:"48px"}).setOrigin(0.5);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyP = this.input.keyboard.addKey("P");

        // UI
        this.info = this.add.text(10,10,"",{fontSize:"18px",fill:"#fff"});
    }

    update(){
        // Pause
        if(Phaser.Input.Keyboard.JustDown(this.keyP)) this.paused = !this.paused;
        if(this.paused){ this.info.setText("⏸️ PAUSED (Press P)"); return; }

        // Speed
        if(this.cursors.up.isDown) this.speed += 0.05; else this.speed -= 0.03;

        // Brake / Drift
        if(this.cursors.down.isDown){
            this.speed -= 0.15;
            this.fog.setText("💨💨");
        }else this.fog.setText("");

        this.speed = Phaser.Math.Clamp(this.speed,0,this.maxSpeed);

        // Move + Tilt
        if(this.cursors.left.isDown){
            this.car.x -= 4;
            this.car.angle = Phaser.Math.Clamp(this.car.angle-2,-15,15);
            this.carEmoji.text = "↖️🏎️";
        }else if(this.cursors.right.isDown){
            this.car.x += 4;
            this.car.angle = Phaser.Math.Clamp(this.car.angle+2,-15,15);
            this.carEmoji.text = "↗️🏎️";
        }else{
            this.car.angle *= 0.9;
            this.carEmoji.text = "🏎️";
        }

        this.car.x = Phaser.Math.Clamp(this.car.x,50,750);
        this.car.scaleY = 1 + this.speed*0.02;

        // Distance
        this.distance += this.speed*0.1;

        // Obstacle movement
        this.obs.y += 4 + this.speed;
        if(this.obs.y>650){
            this.obs.y=-50;
            this.obs.x=Phaser.Math.Between(80,720);
            this.obsEmoji.x = this.obs.x;
            this.obsEmoji.y = this.obs.y;
            this.player.coin +=1;
        }

        // Emoji follow
        this.carEmoji.x = this.car.x;
        this.carEmoji.y = this.car.y;
        this.obsEmoji.x = this.obs.x;
        this.obsEmoji.y = this.obs.y;
        this.fog.x = this.car.x;
        this.fog.y = this.car.y+55;

        // Collision
        if(Phaser.Geom.Intersects.RectangleToRectangle(this.car.getBounds(),this.obs.getBounds())){
            this.fire.setText("🔥🔥🔥");
            saveData(this.player);
            this.scene.start("Finish",{player:this.player,win:false});
        }else this.fire.setText("");

        // Finish
        if(this.distance >= this.finish){
            saveData(this.player);
            this.scene.start("Finish",{player:this.player,win:true});
        }

        this.info.setText(
`🏁 ${this.distance.toFixed(0)} m
⚡ Speed: ${this.speed.toFixed(1)}
🪙 Coin: ${this.player.coin}`
        );
    }
}

// ====== FINISH ======
class Finish extends Phaser.Scene {
    constructor(){ super("Finish"); }
    init(data){ this.player=data.player; this.win=data.win; }

    create(){
        this.cameras.main.setBackgroundColor("#000");

        if(this.win){
            this.player.xp += 40;
            if(this.player.xp >= this.player.nextXP){
                this.player.level++;
                this.player.xp -= this.player.nextXP;
                this.player.nextXP += 50;
                this.player.speed += 0.5;
            }
        }
        saveData(this.player);

        this.add.text(400,220,
            this.win ? "🏆 FINISH SUCCESS 🎉" : "💥 CRASH 🔥",
            {fontSize:"38px",fill:"#ff0"}).setOrigin(0.5);

        let back = this.add.text(400,360,"⬅️ BACK TO LOBBY",
            {fontSize:"26px",fill:"#fff",backgroundColor:"#333",padding:10}
        ).setOrigin(0.5).setInteractive();

        back.on("pointerdown",()=>{ this.scene.start("Lobby"); });
    }
}

// ====== GAME START ======
new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [Lobby,Race,Finish]
});
