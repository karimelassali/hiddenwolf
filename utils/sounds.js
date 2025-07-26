import { Howl } from "howler";
export function Killed(){
    console.log('killed');
    const sound = new Howl({
        src: ['assets/sounds/killed.mp3']
    });
    sound.play();
}

export function Notification(){
    const sound = new Howl({
        src: ['/assets/sounds/noti.mp3']
    });
    sound.play();
}




export function HowlSound(){
    const sound = new Howl({
        src: ['/assets/sounds/howl.mp3']
    });
    sound.play();
}

export function JoinSound(){
    const sound = new Howl({
        src: ['/assets/sounds/join.mp3']
    });
    sound.play();
}


export let backgroundSound;
export function BackgroundSound(){
    if(backgroundSound === undefined){
        backgroundSound = new Howl({
            src: ['/assets/sounds/background.mp3'],
            loop: true,
            volume: 0.1, // Set the volume to 0.2
        });
        backgroundSound.play();
    }
}

export function WinSound(){
    const sound = new Howl({
        src: ['/assets/sounds/win.mp3']
    });
    sound.play();
}

export function LoseSound(){
    const sound = new Howl({
        src: ['/assets/sounds/lose.mp3']
    });
    sound.play();
}
