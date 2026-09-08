# AudioScape Creator

Build a complete production-ready web application called "Quran Player Studio".



The purpose of the application is to create beautiful Quran/Audio videos that look like a modern music-player interface inspired by Spotify, Apple Music and premium audio players.



IMPORTANT:

This is NOT a simple audio visualizer.

The final video must look like a real music player UI displayed inside a video, including:

- Album/cover image

- User logo/avatar

- Track title

- Reciter/artist name

- Current playback time

- Total duration

- Animated progress bar

- Play/pause button

- Previous/next buttons

- Optional waveform/equalizer

- Optional circular progress

- Optional animated cover

- Optional background effects

- Optional lyrics/verse text

- Beautiful typography

- Smooth animations synchronized with the audio



The application must allow the user to create unlimited player designs from templates and customize every visual element.



==================================================

1. MAIN APP STRUCTURE

==================================================



Create a modern responsive dashboard with:



Sidebar:

- Dashboard

- Create Video

- Templates

- My Projects

- My Assets

- Settings



Main dashboard:

- "Create New Video" button

- Recent projects

- Favorite templates

- Quick upload area

- Template gallery



The entire application must work beautifully on mobile, tablet and desktop.



Use a premium dark UI inspired by modern audio production software.



==================================================

2. CREATE VIDEO WORKFLOW

==================================================



Create a step-by-step editor:



STEP 1 — AUDIO



Allow the user to upload:

- MP3

- WAV

- M4A

- AAC

- OGG



Show:

- File name

- Audio duration

- Audio waveform

- Play/pause

- Seek

- Current time

- Total duration



After uploading the audio, automatically detect the exact duration.



The audio duration must become the source of truth for the player timeline.



Example:



If audio is 00:58:



Current time:

00:00



Total duration:

00:58



When the video preview plays, the current time must advance automatically:

00:01

00:02

00:03

etc.



The progress bar must be synchronized with the actual audio playback.



==================================================

3. COVER IMAGE

==================================================



Allow uploading:

- PNG

- JPG

- JPEG

- WEBP



The user can upload:

- Quran artwork

- Album artwork

- Profile image

- Logo



Provide controls:

- Size

- Position

- Border radius

- Rotation

- Opacity

- Shadow

- Border

- Glow

- Crop

- Fit

- Zoom



Allow:

- Square cover

- Circle cover

- Rounded rectangle cover



==================================================

4. LOGO

==================================================



Allow uploading a personal logo/profile image.



Logo controls:

- Position

- Size

- Opacity

- Circular mask

- Border

- Glow

- Shadow



Preset positions:

- Top left

- Top center

- Top right

- Bottom left

- Bottom center

- Bottom right

- Custom



==================================================

5. PLAYER TEMPLATES

==================================================



Create a large template library.



At least 12 initial templates.



Categories:



A. Spotify-inspired

B. Minimal

C. Luxury

D. Islamic

E. Dark

F. Glassmorphism

G. Neon

H. Cinematic

I. Elegant

J. Podcast-style

K. Classic music player

L. Modern Quran player



Each template must have:

- Preview thumbnail

- Template name

- Category

- Favorite button

- Use Template button



IMPORTANT:

Do NOT copy Spotify's exact copyrighted UI.

Use the general concept of modern music players but create original designs.



==================================================

6. PLAYER ELEMENTS

==================================================



Every player template must be modular.



The user must be able to toggle each element ON/OFF:



- Cover

- Logo

- Track title

- Subtitle

- Reciter name

- Artist name

- Current time

- Total duration

- Progress bar

- Waveform

- Equalizer

- Play button

- Pause button

- Previous button

- Next button

- Volume icon

- Heart/favorite icon

- Lyrics

- Verse number

- Background

- Decorative elements



==================================================

7. TEXT EDITOR

==================================================



Allow complete text customization.



Fields:



Title

Subtitle

Reciter

Artist

Album

Verse

Custom text



Controls:



- Font family

- Font size

- Font weight

- Letter spacing

- Line height

- Alignment

- Opacity

- Text color

- Gradient text

- Shadow

- Glow

- Position

- Width

- Maximum lines



Support Arabic text properly.



Use high-quality Arabic fonts.



Include:

- Noto Naskh Arabic

- Amiri

- Noto Kufi Arabic

- Cairo

- Tajawal



The Arabic text must render correctly in RTL.



==================================================

8. COLOR SYSTEM

==================================================



Create a powerful color customization panel.



Allow changing:



- Background

- Primary

- Secondary

- Accent

- Text

- Muted text

- Progress bar

- Progress background

- Buttons

- Waveform

- Glow

- Border



Include:

- Color picker

- HEX input

- RGB input

- HSL input

- Opacity slider



Create preset palettes:



1. Black & Gold

2. Midnight Blue

3. Emerald

4. Burgundy

5. Purple

6. Ocean

7. Sand & Gold

8. Pure Black

9. White & Gold

10. Custom



Also allow the user to save custom palettes.



==================================================

9. BACKGROUND SYSTEM

==================================================



Allow:



Solid color

Gradient

Uploaded image

Uploaded background

Blurred cover

Animated gradient

Particles

Stars

Glow

Bokeh

Islamic geometric patterns



Controls:



Blur

Brightness

Contrast

Saturation

Opacity

Overlay

Vignette

Zoom

Position



Allow uploading a custom background image.



==================================================

10. WAVEFORM SYSTEM

==================================================



Create multiple waveform styles:



- Bars

- Thin line

- Dots

- Rounded bars

- Mirror waveform

- Circular waveform

- Minimal waveform

- Equalizer

- Frequency spectrum



The waveform must react to the uploaded audio.



The waveform should animate while the audio plays.



Allow:

- Waveform color

- Background color

- Height

- Width

- Bar width

- Bar spacing

- Number of bars

- Opacity

- Animation speed

- Smoothing



==================================================

11. PLAYER TIMELINE

==================================================



This is extremely important.



The timeline must be synchronized with the real audio.



Display:



CURRENT TIME / TOTAL TIME



Example:



00:13 / 01:02



Also allow:



- Remaining time mode



Example:



00:13 / -00:49



The progress bar must move according to:



currentTime / duration



The preview must allow seeking by clicking or dragging the progress bar.



When exporting the video, the exact same timing must be used.



==================================================

12. ANIMATIONS

==================================================



Create animation controls for:



Cover:

- None

- Slow zoom

- Pulse

- Rotate

- Floating

- Glow pulse



Logo:

- Fade

- Pulse

- Float



Text:

- Fade in

- Slide up

- Slide down

- Typewriter

- None



Player:

- Fade in

- Slide up

- Scale

- None



Background:

- Slow zoom

- Ken Burns

- Moving gradient

- Particles

- None



All animations must be smooth and subtle.



==================================================

13. VIDEO CANVAS

==================================================



Support:



16:9

9:16

1:1

4:5



Presets:



YouTube

YouTube Shorts

TikTok

Instagram Reels

Instagram Post



Show safe areas for text.



Provide a live preview canvas.



The preview must accurately represent the exported video.



==================================================

14. LIVE PLAYER PREVIEW

==================================================



Create a real interactive player preview.



When the user presses Play:



- Audio plays

- Current time updates

- Progress bar moves

- Waveform animates

- Cover animation starts

- Logo animation starts

- Background animation starts

- All timeline animations stay synchronized



When pressing Pause:

everything pauses at exactly the same position.



When seeking:

all animations update to the new audio position.



==================================================

15. VERSE / LYRICS MODE

==================================================



Add an optional Quran verse mode.



Allow the user to enter Arabic verses manually.



Create:

- Single verse

- Multiple verses

- Verse-by-verse timing



Allow each verse to have:

- Start time

- End time

- Arabic text

- Optional translation



During playback:

highlight the active verse.



Create beautiful Quran typography.



Do not hardcode copyrighted Quran translations.



==================================================

16. PROJECT SYSTEM

==================================================



Users can save projects.



Project fields:



- Project name

- Audio

- Cover

- Logo

- Template

- Canvas size

- Colors

- Typography

- Player settings

- Animation settings

- Verse data



Buttons:



Save

Duplicate

Rename

Delete

Export

Download

Edit



Add autosave.



==================================================

17. ASSET LIBRARY

==================================================



Create an asset library.



Categories:



Audio

Covers

Logos

Backgrounds

Fonts



Allow:

- Upload

- Rename

- Delete

- Search

- Sort

- Favorite



==================================================

18. EXPORT SYSTEM

==================================================



Create a real video export pipeline.



The exported video must contain:



- Background

- Player UI

- Cover

- Logo

- Text

- Waveform

- Progress bar

- Current time

- Total duration

- Animations

- Audio



Export formats:



MP4



Quality:

- 720p

- 1080p



Frame rate:

- 30 FPS

- 60 FPS



Audio:

- AAC

- High quality



The exported video duration must exactly match the uploaded audio duration.



IMPORTANT:

The displayed player time must be rendered into the video itself and must update frame-by-frame according to the audio timeline.



Do not fake the timer with a generic CSS animation.



Use the actual audio duration and frame timeline.



==================================================

19. TECHNICAL IMPLEMENTATION

==================================================



Use a modern production-ready stack.



Preferred:



React

TypeScript

Vite

Tailwind CSS

shadcn/ui



Use HTML5 Audio API for playback and timeline synchronization.



Use Canvas/WebGL where necessary for rendering the player.



For waveform generation:

analyze the uploaded audio and generate waveform data.



For video export:

use a robust browser-compatible rendering/export pipeline.



If browser-only rendering is insufficient for reliable MP4 export, implement a server-side rendering pipeline using a Supabase Edge Function or another suitable backend service.



Do not create fake download buttons.



The Export button must actually generate a video file.



==================================================

20. BACKEND

==================================================



Use Supabase integration.



Create storage buckets for:



audio

covers

logos

backgrounds

exports



Create database tables:



users

projects

templates

assets

palettes

verse_timings



Store project configuration as JSON where appropriate.



Add proper security rules and user ownership.



Users must only access their own projects and private assets.



==================================================

21. TEMPLATE ENGINE

==================================================



IMPORTANT:



Do not hardcode every template separately.



Create a reusable template engine.



Each template should be represented by a configuration object containing:



canvas

background

cover

logo

texts

buttons

timeline

waveform

colors

fonts

animations

positions

sizes



Example structure:



template:

{

  canvas: {},

  background: {},

  cover: {},

  logo: {},

  title: {},

  subtitle: {},

  reciter: {},

  controls: {},

  timeline: {},

  waveform: {},

  animations: {},

  colors: {}

}



This allows users to edit every template without rebuilding the application.



==================================================

22. DRAG AND DROP EDITOR

==================================================



Add a visual editor.



Users should be able to:



- Drag elements

- Resize elements

- Rotate elements

- Change opacity

- Change colors

- Change fonts

- Change alignment

- Lock elements

- Hide elements

- Duplicate elements

- Delete elements



Show bounding boxes while editing.



Add snap-to-grid.



Add alignment guides.



==================================================

23. UNDO / REDO

==================================================



Add:



Undo

Redo



Also add:



Reset template

Reset element

Duplicate project



==================================================

24. RESPONSIVE MOBILE UI

==================================================



The application must be extremely usable on Android phones.



On mobile:



- Editor becomes vertical

- Preview remains visible

- Controls become bottom sheets

- Upload buttons are large

- Color picker works with touch

- Dragging elements works with touch

- Timeline can be dragged with touch



Do not create a desktop-only application.



==================================================

25. DESIGN

==================================================



Premium modern dark interface.



Use:



- Rounded cards

- Soft shadows

- Glass effects

- Subtle gradients

- Smooth transitions

- Minimal icons

- Professional spacing



Avoid:

- Cheap-looking gradients

- Excessive animations

- Clutter

- Generic dashboard appearance



The application should look like a professional SaaS product.



==================================================

26. DEMO DATA

==================================================



Include demo projects and demo templates so the interface is not empty on first launch.



Create at least 12 visually different player templates.



Each template must look substantially different.



==================================================

27. IMPORTANT PRODUCT BEHAVIOR

==================================================



The most important feature is:



UPLOAD AUDIO → SELECT TEMPLATE → UPLOAD COVER/LOGO → EDIT TEXT/COLORS → PREVIEW → EXPORT MP4



This entire flow must actually work.



Do not leave placeholder buttons.



Do not use fake functionality.



Do not create "Coming Soon" for core features.



If a complex feature cannot be implemented entirely in the browser, implement the necessary backend/server-side rendering instead of pretending it works.



==================================================

28. FINAL QUALITY REQUIREMENTS

==================================================



Before finishing:



- Test audio upload

- Test image upload

- Test logo upload

- Test playback

- Test pause

- Test seek

- Test progress bar

- Test timer

- Test waveform

- Test template switching

- Test color changes

- Test Arabic RTL

- Test mobile UI

- Test project saving

- Test export



Fix all TypeScript errors.



Fix all console errors.



Make sure the app is functional and polished.



Build the complete application now.

Do not only create a landing page or mockup.

اهم حاجة تصدير الفيديو يكون سريع جدا وعايز القوالب زي مشغل موسيقي بتاع الايفون وبتاع الاندرويد وبتاع Spotify وغيره وغيره فهمت بسرعة بس

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/93eb61eb-897f-42fb-a609-ed8eb9d2335a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
