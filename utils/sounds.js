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