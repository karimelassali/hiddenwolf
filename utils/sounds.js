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