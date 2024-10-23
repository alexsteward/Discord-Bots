from discord import Embed
from discord.ext import commands
from spotipy.oauth2 import SpotifyClientCredentials
from datetime import datetime

import re
import discord
import yt_dlp
import spotipy


# Set up intents
intents = discord.Intents.default()  
intents.message_content = True  
intents.voice_states = True

# Set up the bot with a command prefix and intents
bot = commands.Bot(command_prefix='?', intents=intents)  

# CHANNEL IDS
CHANNEL_ID = 1294828568509022218  # Your channel ID


# Spotify API setup
spotify_client_id = '57f774904435468ca9a3e7aca06398a5'  # Replace with your Spotify client ID
spotify_client_secret = 'c1af00eff5474e778df00ca699f9c1b5'  # Replace with your Spotify client secret
sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(client_id=spotify_client_id,
                                                           client_secret=spotify_client_secret))

# Event: Bot is ready
@bot.event
async def on_ready():
    print(f'Bot is online as {bot.user.name} (ID: {bot.user.id})')
    
    # Get the channel to send the online message
    channel = bot.get_channel(CHANNEL_ID)  
    if channel:
        await channel.send(f'{bot.user.name} is online!')


# Variables:
current_track_start_time = None  # Global variable to store track start time
current_track_duration = 0  # 
music_queue = []  # Initialize the music queue
voice_client = None  # Store the voice client
is_looping = False
is_shuffling = False
current_playing_track = None  # Variable to store the currently playing track
global_volume = 100

# -------------------------------------------------------------------------------------- #


## JOINS -----
@bot.command()
async def join(ctx):
    """Join the voice channel."""
    if ctx.author.voice:
        channel = ctx.author.voice.channel
        await channel.connect()
        embed = discord.Embed(title="🎶 Joined Voice Channel", description=f"Connected to {channel.name}", color=0x1DB954)
        await ctx.send(embed=embed)
    else:
        await ctx.send("❌ You need to be in a voice channel to use this command.")





## LEAVE -----
@bot.command()
async def leave(ctx):
    """Leave the voice channel."""
    global voice_client
    if ctx.voice_client:
        await ctx.voice_client.disconnect()
        clear_queue()  # Clear the queue when leaving
        embed = discord.Embed(title="👋 Left Voice Channel", description="Disconnected from the voice channel and cleared the queue.", color=0xFF0000)
        await ctx.send(embed=embed)
    else:
        await ctx.send("❌ I'm not in a voice channel.")





## PAUSE -----
@bot.command()
async def pause(ctx):
    """Pause the current track."""
    voice_client = ctx.voice_client
    if voice_client and voice_client.is_playing():
        voice_client.pause()
        embed = discord.Embed(title="⏸ Paused", description="Paused the current track.", color=0xFFD700)
        await ctx.send(embed=embed)
    else:
        await ctx.send("❌ I'm not currently playing anything.")





## RESUME -----
@bot.command()
async def resume(ctx):
    """Resume the current track."""
    voice_client = ctx.voice_client
    if voice_client and voice_client.is_paused():
        voice_client.resume()
        embed = discord.Embed(title="▶️ Resumed", description="Resumed the current track.", color=0x1DB954)
        await ctx.send(embed=embed)
    else:
        await ctx.send("❌ I'm not currently paused.")





## PLAY -----
@bot.command()
async def play(ctx, *, track_name):
    """Play a track or add it to the queue (YouTube for Spotify)."""
    global voice_client, global_volume
    voice_client = ctx.voice_client

    if voice_client is None:
        if ctx.author.voice:
            await join(ctx)
            voice_client = ctx.voice_client
        else:
            await ctx.send("❌ You need to be in a voice channel for me to play music!")
            return

    if voice_client is None:
        await ctx.send("❌ I couldn't join your voice channel.")
        return

    # Regex patterns for Spotify links
    spotify_track_regex = r"(https://open.spotify.com/track/([a-zA-Z0-9]+))"
    spotify_playlist_regex = r"(https://open.spotify.com/playlist/([a-zA-Z0-9]+))"

    spotify_match = re.search(spotify_track_regex, track_name)
    playlist_match = re.search(spotify_playlist_regex, track_name)

    if spotify_match:
        # Handling Spotify track link
        track_id = spotify_match.group(2)
        track_info = sp.track(track_id)
        title = track_info['name'] + " " + track_info['artists'][0]['name']
        thumbnail = track_info['album']['images'][0]['url']

        # Search for the track on YouTube
        ydl_opts = {'format': 'bestaudio/best', 'quiet': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(f'ytsearch:{title}', download=False)
                url = info['entries'][0]['url']
                video_title = info['entries'][0]['title']
                duration = info['entries'][0]['duration']
            except Exception as e:
                await ctx.send(f'Error: {str(e)}')
                return

        music_queue.append((video_title, url, thumbnail, duration))

        embed = discord.Embed(title="🎶 Track Added to Queue", description=f"**{video_title}** (via Spotify search)", color=0x1DB954)
        embed.set_thumbnail(url=thumbnail)
        embed.add_field(name="Position", value=f"#{len(music_queue)} in queue", inline=True)
        embed.add_field(name="Duration", value=f"{duration // 60}:{duration % 60:02d} minutes", inline=True)
        await ctx.send(embed=embed)

    elif playlist_match:
        # Handling Spotify playlist link
        playlist_id = playlist_match.group(2)
        playlist_info = sp.playlist(playlist_id)
        playlist_tracks = playlist_info['tracks']['items']

        for item in playlist_tracks:
            track = item['track']
            title = track['name'] + " " + track['artists'][0]['name']
            thumbnail = track['album']['images'][0]['url']

            ydl_opts = {'format': 'bestaudio/best', 'quiet': True}
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                try:
                    info = ydl.extract_info(f'ytsearch:{title}', download=False)
                    url = info['entries'][0]['url']
                    video_title = info['entries'][0]['title']
                    duration = info['entries'][0]['duration']
                except Exception as e:
                    await ctx.send(f'Error: {str(e)}')
                    continue

            music_queue.append((video_title, url, thumbnail, duration))

        embed = discord.Embed(title="🎶 Playlist Added to Queue", description=f"**{playlist_info['name']}** (via Spotify search)", color=0x1DB954)
        embed.set_thumbnail(url=playlist_info['images'][0]['url'])
        embed.add_field(name="Number of tracks", value=f"{len(playlist_tracks)} added", inline=True)
        await ctx.send(embed=embed)

    else:
        # Handling YouTube search directly
        ydl_opts = {'format': 'bestaudio/best', 'quiet': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(f'ytsearch:{track_name}', download=False)
                url = info['entries'][0]['url']
                title = info['entries'][0]['title']
                thumbnail = info['entries'][0]['thumbnail']
                duration = info['entries'][0]['duration']
            except Exception as e:
                await ctx.send(f'Error: {str(e)}')
                return

        music_queue.append((title, url, thumbnail, duration))

        embed = discord.Embed(title="🎶 Track Added to Queue", description=f"**{title}**", color=0x1DB954)
        embed.set_thumbnail(url=thumbnail)
        embed.add_field(name="Position", value=f"#{len(music_queue)} in queue", inline=True)
        embed.add_field(name="Duration", value=f"{duration // 60}:{duration % 60:02d} minutes", inline=True)
        await ctx.send(embed=embed)

    # Play the next track if nothing is playing
    if not voice_client.is_playing() and not voice_client.is_paused():
        await play_next(ctx)






## SHUFFLE & PLAY NEXT -----
@bot.command()
async def shuffle(ctx):
    """Toggle shuffle mode."""
    global is_shuffling
    is_shuffling = not is_shuffling
    state = "enabled" if is_shuffling else "disabled"
    embed = discord.Embed(title="🔀 Shuffle Mode", description=f"Shuffle has been {state}.", color=0x1DB954)
    await ctx.send(embed=embed)

async def play_next(ctx):
    """Play the next track in the queue (YouTube or Spotify)."""
    global global_volume, current_playing_track, current_track_start_time, current_track_duration
    voice_client = ctx.voice_client

    if music_queue:
        # Adjust unpacking to include duration
        title, url, thumbnail, duration = music_queue.pop(0)
        current_playing_track = (title, url, thumbnail)

        if "spotify" in url:
            # Spotify URL, use Spotify Web Player or some third-party API
            await ctx.send(f"🎶 Now playing from Spotify: **{title}**. You can listen to it [here]({url})")
            current_track_duration = 0  # Cannot determine duration for Spotify links in this example
        else:
            # YouTube URL
            ydl_opts = {
                'format': 'bestaudio/best',
                'quiet': True
            }

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                try:
                    info = ydl.extract_info(url, download=False)
                    current_track_duration = info.get('duration', 0)  # Get total duration of the track
                except Exception as e:
                    await ctx.send(f'Error: {str(e)}')
                    current_track_duration = 0
                    return

            source = discord.FFmpegPCMAudio(
                url,
                options='-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5 -buffer_size 1256k'
            )
            source = discord.PCMVolumeTransformer(source, volume=global_volume / 100)

            def after_playback(e):
                if e:
                    print(f'Error occurred in playback: {str(e)}')
                bot.loop.create_task(play_next(ctx))

            voice_client.play(source, after=after_playback)

            # Mark the start time of the track
            current_track_start_time = datetime.now()

            embed = discord.Embed(title="🎶 Now Playing", description=f"**{title}**", color=0x1DB954)
            embed.set_thumbnail(url=thumbnail)
            embed.add_field(name="Volume", value=f"🔊 {global_volume}%", inline=True)
            embed.add_field(name="Requested by", value=ctx.author.display_name, inline=True)
            embed.set_footer(text="Use ?skip to skip the track or ?stop to stop the queue.")
            await ctx.send(embed=embed)
    else:
        await ctx.send("🛑 The queue is now empty.")





## PLAY CURRENT -----
async def play_current(ctx):
    """Replays the current song."""
    voice_client = ctx.voice_client

    if music_queue:
        title, url, thumbnail = music_queue[0]  # Get the current song again

        source = discord.FFmpegPCMAudio(
            url,
            options='-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5 -buffer_size 1256k'
        )

        def after_playback(e):
            if e:
                print(f'Error occurred in playback: {str(e)}')
            else:
                print("Playback finished without errors.")
            bot.loop.create_task(play_next(ctx))  # Move to the next song after looping

        voice_client.play(source, after=after_playback)

        embed = discord.Embed(
            title="🔁 Now Looping",
            description=f"**{title}**",
            color=0x1DB954
        )
        embed.set_thumbnail(url=thumbnail)
        embed.add_field(name="Volume", value="🔊 100%", inline=True)
        embed.add_field(name="Requested by", value=ctx.author.display_name, inline=True)
        embed.set_footer(text="Use ?skip to skip the track or ?stop to stop the queue.")

        await ctx.send(embed=embed)





## SKIP -----
@bot.command()
async def skip(ctx):
    """Skip the current track."""
    voice_client = ctx.voice_client
    if voice_client and (voice_client.is_playing() or voice_client.is_paused()):
        voice_client.stop()
        embed = discord.Embed(title="⏩ Skipped", description="Skipped the current track.", color=0xFFD700)
        await ctx.send(embed=embed)
        await play_next(ctx)  # Play the next track if available
    else:
        await ctx.send("❌ I'm not currently playing anything.")





## QUEUE -----
@bot.command()
async def queue(ctx):
    """Display the current queue."""
    if music_queue:
        embed = discord.Embed(title="🎶 Music Queue", description="Here's the current list of tracks:", color=0x7289DA)
        
        for index, (title, url, thumbnail, duration) in enumerate(music_queue):
            # Add each track to the embed with its position, title, and duration
            embed.add_field(name=f"#{index + 1}", value=f"**{title}** - Duration: {duration // 60}:{duration % 60:02d} minutes", inline=False)

        await ctx.send(embed=embed)
    else:
        embed = discord.Embed(title="🎶 Music Queue", description="The queue is currently empty.", color=0xFF5733)
        await ctx.send(embed=embed)






## STOP -----
@bot.command()
async def stop(ctx):
    """Stop the current track and clear the queue."""
    voice_client = ctx.voice_client
    if voice_client and (voice_client.is_playing() or voice_client.is_paused()):
        voice_client.stop()
        clear_queue()  # Clear the queue when stopping
        embed = discord.Embed(title="🛑 Stopped", description="Stopped the current track and cleared the queue.", color=0xFF0000)
        await ctx.send(embed=embed)
    else:
        await ctx.send("❌ I'm not currently playing anything.")

def clear_queue():
    """Clear the music queue."""
    music_queue.clear()





## SONG INFO -----
@bot.command()
async def songinfo(ctx):
    """Show information about the currently playing song."""
    voice_client = ctx.voice_client

    if voice_client is None or not voice_client.is_playing():
        await ctx.send("❌ No song is currently playing.")
        return

    # Check if there is a currently playing track
    if current_playing_track:  # Now using the global variable
        title, url, thumbnail = current_playing_track  # Unpack the song details

        # Create an embed to display song information
        embed = discord.Embed(
            title="🎶 Now Playing",
            description=f"**{title}**",
            color=0x1DB954
        )
        embed.set_thumbnail(url=thumbnail)  # Set the thumbnail for the song
        embed.add_field(name="URL", value=f"[Listen Here]({url})", inline=False)  # Display the song URL as a clickable link
        embed.add_field(name="Requested by", value=ctx.author.display_name, inline=True)  # Show who requested it
        embed.set_footer(text="Use ?skip to skip the track or ?stop to stop the queue.")

        await ctx.send(embed=embed)
    else:
        await ctx.send("❌ No song is currently playing.")





## LOOP -----
@bot.command()
async def loop(ctx):
    """Toggle loop mode for the current song."""
    global is_looping
    is_looping = not is_looping
    state = "enabled" if is_looping else "disabled"
    embed = discord.Embed(title="🔁 Loop Mode", description=f"Loop has been {state}.", color=0x1DB954)
    await ctx.send(embed=embed)





## VOLUME -----
@bot.command()
async def volume(ctx, level: int):
    """Set the global volume for all tracks (0-100)."""
    global global_volume

    if 0 <= level <= 100:
        global_volume = level  # Update the global volume
        await ctx.send(f"🔊 Global volume set to {level}%.")
        
        # If currently playing, update the volume of the voice client
        if ctx.voice_client and ctx.voice_client.is_playing():
            ctx.voice_client.source.volume = global_volume / 100
    else:
        await ctx.send("⚠️ Please enter a volume level between 0 and 100.")





## CURRENT VOLUME -----
@bot.command()
async def current_volume(ctx):
    """Show the current global volume level."""
    global global_volume
    await ctx.send(f"🔊 Current global volume level is {global_volume}%.")








TOKEN = 'MTI5NzU5MjEwMjczMzA5MDgyNg.Gl-wuL.1H3N4RJF3iv4_y34LOKPXmhzhask0bwySfk8AA'  # Replace with your actual bot token
bot.run(TOKEN)

