# Discord Music Bot 🎶

A feature-rich Discord bot for playing music from Spotify and YouTube with additional controls like queue management, shuffle, and looping. Built using `discord.py`, `yt-dlp`, and Spotify API.

## Features

- **Join and Leave Voice Channels**: The bot can join the user's voice channel and leave when requested.
- **Play Music**: Plays tracks from YouTube or Spotify links or searches for them.
- **Queue Management**: Add tracks to the queue and play them sequentially.
- **Pause, Resume, and Skip**: Control the playback of current tracks.
- **Shuffle and Loop**: Shuffle the queue or loop the current song.
- **Song Information**: Display detailed information about the currently playing track.
- **Volume Control**: Set and display the global volume level for all tracks.
- **Spotify Integration**: Play tracks and playlists directly from Spotify.

## Skills Learned

- **Python Development**: Developed a bot using Python's `discord.py` library.
- **Asynchronous Programming**: Managed multiple tasks simultaneously using Python's `asyncio`.
- **Command Handling**: Created command structures for user interaction with the bot.
- **File I/O**: Managed data using JSON files to store user preferences and queue information.
- **Error Handling**: Handled potential errors (e.g., invalid URLs, missing permissions) gracefully.
- **Version Control**: Used Git for source control and collaboration on GitHub.
  
## Tools Used

- **Languages**: Python
- **Libraries**:
  - [`discord.py`](https://discordpy.readthedocs.io/en/stable/): For creating the bot and handling Discord events.
  - [`yt-dlp`](https://github.com/yt-dlp/yt-dlp): For downloading and playing audio from YouTube.
  - [`spotipy`](https://spotipy.readthedocs.io/en/2.16.1/): For interacting with Spotify's API.
- **APIs**:
  - [Discord API](https://discord.com/developers/docs/intro): To manage bot and server interactions.
  - [Spotify API](https://developer.spotify.com/documentation/web-api/): To fetch and play songs and playlists from Spotify.
- **Audio Tools**:
  - [`FFmpeg`](https://ffmpeg.org/): Required for handling audio streaming.
- **Version Control**: Git and GitHub for managing the project's development.

## Commands

## Commands

### `?help`
- Shows a help message with available commands.

### `?join`
- Joins the user's voice channel.

### `?leave`
- Disconnects the bot from the voice channel and clears the queue.

### `?play <track_name | youtube_url | spotify_url>`
- Plays the specified track from YouTube or Spotify, or adds it to the queue if a track is already playing.

### `?pause`
- Pauses the current track.

### `?resume`
- Resumes the paused track.

### `?skip`
- Skips the current track.

### `?stop`
- Stops the current track and clears the queue.

### `?queue`
- Displays the current queue of tracks.

### `?loop`
- Toggles loop mode for the current song.

### `?shuffle`
- Toggles shuffle mode for the current queue.

### `?volume <0-100>`
- Sets the global volume level for all tracks between 0 and 100.

### `?current_volume`
- Displays the current global volume level.

### `?songinfo`
- Shows detailed information about the currently playing song, such as title, artist, and duration.

  
## Installation

### Prerequisites
- Python 3.8 or higher
- [Discord Bot Token](https://discord.com/developers/applications)
- [Spotify Developer Account](https://developer.spotify.com/dashboard/applications)
- `FFmpeg` for audio playback

### Libraries

Install the required libraries with:

```bash
pip install discord.py spotipy yt-dlp

