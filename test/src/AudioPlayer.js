import React, { Component } from "react";
import ReactHowler from "react-howler";
import PropTypes from "prop-types";

import { PlayButton, Progress, Timer } from "react-soundplayer/components";
import apiCall from "./apiCall";
import randomMp3 from "./media/random.mp3";

const DEFAULT_DURATION = 456.1495; // have to use this become modifying the audio file breaks 2x speed
const SPACE_BETWEEN_BARS = 0.3; // determines the space between wave bars
const DEFAULT_MP3 =
  "https://parse-server-ff.s3.amazonaws.com/ae5992f0f5bb1f259bafa41b3771e3bb_call12565815456dwwwwww795896232www-01b59bd3.mp3";

class AudioPlayer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playing: false,
      currentTime: 0,
      speedup: false,
      loadErr: false,
      buckets: [] // will contain audio file converted into Float32Array of the loudest volume at a point in time
    };
    this.selectProgressDiv = React.createRef(); // reference to the progress parent div
  }

  seek(secs, play) {
    if (secs && secs.seek != null) secs = secs.seek();
    this.player.seek(secs);
    let toSet = { currentTime: secs };
    if (play == true) toSet.playing = true;
    this.setState(toSet);
  }

  toggleRate() {
    let { speedup } = this.state;
    speedup = !speedup;
    this.setState({ speedup });
    this.player._howler.rate(speedup ? 2.0 : 1.0);
  }

  getState() {
    let { playing, currentTime } = this.state;
    return { playing, currentTime };
  }

  /**
   *
   * @param {Object} e - The event object
   * @param {*} ref - Reference to a react element
   */
  waveSeeker(e, ref) {
    const secs = (e.clientX - ref.getBoundingClientRect().x) / ref.offsetWidth;
    this.seek(secs * this.state.duration, true);
  }

  getSeek() {
    if (this.playerInterval) clearInterval(this.playerInterval);
    this.playerInterval = setInterval(() => {
      let { mp3url } = this.props;
      if (this.player) {
        let currentTime = this.player.seek();
        const duration =
          mp3url == DEFAULT_MP3 ? DEFAULT_DURATION : this.player.duration();
        const toSet = { currentTime };
        if (!this.state.duration && duration != null) {
          toSet.duration = duration;
        }
        if (duration != null) toSet.loadErr = false;
        if (mp3url == DEFAULT_MP3 && currentTime >= DEFAULT_DURATION) {
          this.player.stop();
          toSet.playing = false;
          currentTime = 0;
        }
        this.setState(toSet);
      }
    }, 250);
  }

  togglePlay() {
    this.setState(() => ({ playing: !this.state.playing }));
  }

  componentWillUnmount() {
    if (this.playerInterval) clearTimeout(this.playerInterval);
  }

  async componentDidMount() {
    this.getSeek();
    const streamlinedAudio = await apiCall(randomMp3);
    this.setState({ buckets: streamlinedAudio });
  }

  isObject(obj) {
    return obj instanceof Object || (typeof obj === "object" && obj !== null);
  }

  render() {
    const { mp3url } = this.props;
    let { playing, currentTime, duration, speedup, loadErr } = this.state;
    if (this.isObject(currentTime)) currentTime = 0;
    if (mp3url == DEFAULT_MP3) duration = DEFAULT_DURATION;
    return (
      <div>
        <div className="ff-audio" style={{ position: "relative" }}>
          {duration != null ? (
            <div className="flex flex-center px2 relative z1">
              <PlayButton
                playing={playing}
                onTogglePlay={() => this.togglePlay()}
                className="flex-none h2 mr2 button button-transparent button-grow rounded mobile-play-btn"
              />
              {/* seeking={Boolean}
                        seekingIcon={ReactElement} */}

              <div className="sb-soundplayer-volume mr2 flex flex-center mobile-speed-control-div">
                <button
                  onClick={() => this.toggleRate()}
                  className="sb-soundplayer-btn sb-soundplayer-volume-btn flex-none h2 button button-transparent button-grow rounded mobile-speed-control-btn"
                >
                  <img
                    className={speedup ? "audio-speedup" : ""}
                    src="/pane/speedup.svg"
                    height={35}
                    alt="speed up btn"
                  />
                </button>
              </div>
              <div
                className="flex-auto bg-darken-3 rounded"
                style={{ position: "relative" }}
                ref={this.selectProgressDiv}
              >
                <Progress
                  innerClassName="rounded-left bg-white"
                  value={((currentTime || 0) / (duration || 1)) * 100 || 0}
                  onSeekTrack={ts => this.seek(ts * duration)}
                />
                {/* The red ball element on the progress bar. Also include a vertical white line */}
                <div
                  className="progress-ball-div"
                  style={{
                    left: `${
                      this.state.currentTime
                        ? `calc(${(this.state.currentTime /
                            this.state.duration) *
                            100}% - 15px)`
                        : "-15px"
                    }`
                  }}
                >
                  <div className="progress-ball-div-inner-ball" />
                </div>
                <hr
                  className="progress-horizontal-line"
                  style={{
                    left: `calc(${(this.state.currentTime /
                      this.state.duration) *
                      100}% - 30px)`
                  }}
                />
                <div
                  className="waveform-parent-div"
                  onClick={e =>
                    this.waveSeeker(e, this.selectProgressDiv.current)
                  }
                >
                  {/* <!-- this SVG is the "background" and progress bar --> */}
                  <svg
                    viewBox="0 0 100 100"
                    className="waveform-container"
                    preserveAspectRatio="none"
                  >
                    <rect
                      className="waveform-bg"
                      x="0"
                      y="0"
                      height="100"
                      width="100"
                    />
                    <rect
                      id="waveform-progress"
                      className="waveform-progress"
                      x="0"
                      y="0"
                      height="100"
                      width={`${(this.state.currentTime / this.state.duration) *
                        100}`}
                      style={{ transition: "width 0.2s ease-in" }}
                    />
                    {/* <rect
                      className="highlited-wave"
                      x={`${this.state.highliteStart / 100}`}
                      y="0"
                      width={`${this.state.width / 100}`}
                      height="100"
                      fill={`${this.state.width ? "red" : "transparent"}`}
                    /> */}
                  </svg>

                  {/* <!-- this SVG is the "clipping mask" - the waveform bars --> */}
                  <svg height="0" width="0">
                    <defs>
                      <clipPath id="waveform-mask">
                        {this.state.buckets.map((bucket, i) => {
                          let bucketSVGHeight = bucket * 100.0;
                          return (
                            <rect
                              x={`${1 * i + SPACE_BETWEEN_BARS / 2.0}`}
                              y={`${(100 - bucketSVGHeight) / 2.0}`}
                              width={`${1 - SPACE_BETWEEN_BARS}`}
                              height={`${bucketSVGHeight}`}
                              key={i}
                              ry={"3"}
                              rx={"3"}
                            />
                          );
                        })}
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </div>

              <Timer
                className={"timer"}
                duration={duration} // in seconds
                currentTime={currentTime != null ? currentTime : 0}
              />
            </div>
          ) : loadErr ? (
            <div style={{ padding: "5 20px" }}>
              Unable to load audio: {loadErr}
            </div>
          ) : (
            <div className="progress">
              <div className="indeterminate" />
            </div>
          )}
          <div>
            <ReactHowler
              src={mp3url}
              playing={playing}
              loop={false}
              onLoadError={(id, err) => {
                console.log("Unable to load media", err);
                this.setState({
                  loadErr: (err && err.message) || "Startup error"
                });
              }}
              onLoad={() => this.getSeek()}
              ref={ref => (this.player = ref)}
            />
          </div>
        </div>
      </div>
    );
  }
}

AudioPlayer.propTypes = {
  mp3url: PropTypes.string.isRequired
};

export default AudioPlayer;
