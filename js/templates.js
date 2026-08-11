/* ==========================================================================
   MadeForYou - Pre-built Heartfelt Templates Library
   Provides meaningful default messages based on relationship & occasion
   ========================================================================== */

const SURPRISE_TEMPLATES = {
    "My Love": {
        "Love": "Every single moment spent with you feels like a dream come true. You bring so much joy, warmth, and laughter into my life. I love you more than words could ever describe! ❤️",
        "Birthday": "Happy Birthday to the most amazing person in my world! 🎉 May your day be filled with all the love, happiness, and sweetness you bring into my life every single day. 🎂❤️",
        "I Miss You": "Distance means so little when someone means so much. Thinking of you today and counting down every second until I get to hold you again. 🥹💖",
        "Courage": "Whatever challenge you are facing right now, remember how resilient, brave, and incredible you are. I believe in you always and I'm right here by your side. 💪❤️",
        "Thank You": "Thank you for being my rock, my safe place, and my favorite smile. I appreciate everything you do for us more than you know. 🙏💕",
        "Happiness": "Just a small reminder to smile today! You deserve all the peace, joy, and happiness in the universe. Have a beautiful day, my love! 😊☀️",
        "Appreciation": "I just wanted to take a moment to tell you how deeply grateful I am to have you in my life. You make every ordinary moment feel extraordinary. 🌹❤️",
        "Just Because": "No special occasion needed—just wanted to send you a little digital love note to remind you how deeply loved and cherished you are! 💌✨"
    },
    "My Mother": {
        "Love": "To my wonderful Mom ❤️ Sometimes I don't say it enough, but I want you to know how deeply I appreciate your endless love, patience, and sacrifices. I love you with all my heart!",
        "Birthday": "Happy Birthday to the queen of our family! 🎂 Thank you for giving me the best childhood, constant support, and unconditional love. May your year be filled with blessings! 🌸",
        "I Miss You": "Thinking of you today, Mom. Missing your warm hugs, your comforting words, and your gentle smile. Sending you all my love across the distance! 🥹❤️",
        "Thank You": "Thank you, Mom, for every sacrifice you made for me, for every quiet prayer, and for always believing in me even when I struggled. You are my superhero. 🙏❤️",
        "Appreciation": "Mom, your kindness and wisdom inspire me every day. Thank you for making our home a place of warmth, happiness, and peace. You mean the world to me! 🌹"
    },
    "My Father": {
        "Love": "Dad, thank you for being my guiding light, my protector, and my pillar of strength. I am so proud to be your child. Love you always! 👔❤️",
        "Birthday": "Happy Birthday Dad! 🎂 Wishing you strength, great health, joy, and relaxation on your special day. Thank you for everything you do for us!",
        "Thank You": "Thank you Dad for all the lessons, hard work, and support over the years. You've taught me what true dedication means. Respect and love always! 🙏",
        "Courage": "Dad, stay strong! You have overcome so many hurdles in life, and I know you will master this one too. We are all behind you 100%. 💪"
    },
    "My Daughter": {
        "Love": "To my sweet daughter, watching you grow into such a kind, smart, and beautiful person is the greatest joy of my life. Never forget how loved you are! 👧❤️",
        "Birthday": "Happy Birthday to my precious daughter! 🎂 May your day sparkle with joy, laughter, and all your favorite things. Keep shining bright! ✨",
        "Courage": "My dear daughter, believe in yourself as much as I believe in you. You have so much talent and strength inside. Go conquer your dreams! 💪💖"
    },
    "My Son": {
        "Love": "To my wonderful son, I am so proud of the man you are becoming. Never stop chasing your dreams and standing tall. Always here for you! 👦❤️",
        "Birthday": "Happy Birthday son! 🎂 Wishing you a year filled with grand adventures, success, happiness, and victory. Have an awesome celebration!",
        "Courage": "Son, tough times don't last, but tough people do. Keep your head held high and keep pushing forward. I'm always cheering for you! 💪"
    },
    "My Sister": {
        "Love": "To my dearest sister, you are not just family, you're my best friend for life. Thank you for all the shared memories and laughter! 👭❤️",
        "Birthday": "Happy Birthday sister! 🎂 From secret keeping to endless laughs, life is so much brighter with you in it. Celebrate big today! 🎉",
        "Thank You": "Thank you for always having my back, giving the best advice, and being someone I can always count on. You're the best! 🙏💖"
    },
    "My Brother": {
        "Love": "To my brother, thank you for all the good times, jokes, and support over the years. Honored to have you in my corner. 👦🔥",
        "Birthday": "Happy Birthday Bro! 🎂 Wishing you success, health, and epic moments this year. Let's make it unforgettable!",
        "Thank You": "Thanks for being a reliable brother and always stepping up when needed. Really appreciate you, man! 🙏"
    },
    "My Friend": {
        "Love": "Good friends are like stars—you don't always see them, but you know they're always there. Thank you for being such a genuine friend! 🤝❤️",
        "Birthday": "Happy Birthday to my awesome friend! 🎂 May this new age bring you boundless opportunity, good vibes, and endless happiness!",
        "I Miss You": "Hey! Missing our hangouts, deep talks, and crazy laughs. Let's catch up real soon! 🥹✨",
        "Thank You": "Thank you for listening without judgment and always bringing positive energy into my life. Truly blessed to call you my friend! 🙏"
    },
    "Someone Special": {
        "Love": "You hold a very unique and cherished place in my heart. Just wanted to make sure you know how bright you make my days! ✨❤️",
        "Appreciation": "I wanted to send a little reminder of how appreciated, valued, and special you are. Thank you for being you! 🌹"
    }
};

/**
 * Helper to fetch a default template or fallback
 */
function getTemplateFor(relationship, occasion) {
    if (SURPRISE_TEMPLATES[relationship] && SURPRISE_TEMPLATES[relationship][occasion]) {
        return SURPRISE_TEMPLATES[relationship][occasion];
    }
    // Generic Fallback
    return `Dearest ${relationship || 'friend'},\n\nI just wanted to take a moment to send you this little surprise and remind you how special you are to me. Thank you for bringing so much brightness, love, and joy into my life. I appreciate you more than words can say! ❤️`;
}
