import { useEffect, useState } from "react";
import AdventureMap from "./components/AdventureMap";
import WorldMap from "./components/WorldMap";
import ArrayLesson from "./components/ArrayLesson";
import DemoLesson from "./components/DemoLesson";
import BubbleGame from "./components/BubbleGame";
import { currentLesson, lessonUnlocked, nextLesson, readTrackProgress, regionForLesson, REGIONS, regionUnlocked, saveTrackProgress, type RegionId, type TrackId } from "./engine/learningTrack";
import ExpeditionPlay from "./components/ExpeditionPlay";
import type { Difficulty } from "./engine/quicksort";
import { gameAudio, readSoundPreference } from "./audio/gameAudio";

export default function App() {
  const [scene, setScene] = useState<"map" | "demo" | "play">("map");
  const [mapView, setMapView] = useState<"world" | "region">("world");
  const [region, setRegion] = useState<RegionId>(() => regionForLesson(currentLesson(readTrackProgress()).id).id);
  const [worldLocation, setWorldLocation] = useState<RegionId>(() => regionForLesson(currentLesson(readTrackProgress()).id).id);
  const [worldArrival, setWorldArrival] = useState<RegionId | null>(null);
  const [completed, setCompleted] = useState(readTrackProgress);
  const [arrivalFrom, setArrivalFrom] = useState<TrackId | null>(null);
  const [algorithm, setAlgorithm] = useState<TrackId>(() => currentLesson(readTrackProgress()).id);
  const [input, setInput] = useState([8, 3, 6, 2, 5]);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [sound, setSound] = useState(readSoundPreference);
  const [speed, setSpeed] = useState(1);
  const [session, setSession] = useState(0);
  useEffect(() => {
    gameAudio.setEnabled(sound);
  }, [sound]);
  useEffect(() => { saveTrackProgress(completed); }, [completed]);
  function complete() {
    if (!lessonUnlocked(algorithm, completed)) return;
    if (!completed[algorithm]) setArrivalFrom(algorithm);
    setCompleted(value => value[algorithm] ? value : { ...value, [algorithm]: true });
  }
  function start(mode: "demo" | "play") {
    if (algorithm !== "bubble" && algorithm !== "quick" && algorithm !== "array") return;
    if (!lessonUnlocked(algorithm, completed)) return;
    gameAudio.unlock();
    gameAudio.play("enter");
    setSession((value) => value + 1);
    setScene(mode);
  }
  function back() {
    gameAudio.stop();
    setMapView("region");
    setScene("map");
  }
  function chooseMap() {
    const next = nextLesson(algorithm);
    if (arrivalFrom && next && regionForLesson(next.id).id !== region && lessonUnlocked(next.id, completed)) {
      gameAudio.stop();
      const destination = regionForLesson(next.id).id;
      setWorldArrival(region);
      setWorldLocation(destination);
      setRegion(destination);
      setAlgorithm(next.id);
      setArrivalFrom(null);
      setMapView("world");
      setScene("map");
      return;
    }
    back();
  }
  function enterRegion(id: RegionId) {
    if (!regionUnlocked(id, completed)) return;
    setWorldArrival(null);
    const territory = REGIONS.find(item => item.id === id)!;
    const lesson = territory.lessons.find(item => !completed[item.id]) ?? territory.lessons[territory.lessons.length - 1];
    setRegion(id);
    setAlgorithm(lesson.id);
    setArrivalFrom(null);
    setMapView("region");
    setWorldLocation(id);
  }
  function updateArray(values: number[], level: Difficulty) {
    gameAudio.stop();
    setInput(values);
    setDifficulty(level);
    setSession((value) => value + 1);
  }
  if (scene === "map" && mapView === "world") return <WorldMap completed={completed} sound={sound} onSound={() => setSound(!sound)} onEnter={enterRegion} location={worldLocation} onLocation={setWorldLocation} arrivalFrom={worldArrival} onArrived={() => setWorldArrival(null)} />;
  if (scene === "map")
    return (
      <AdventureMap
        key={region}
        region={region}
        onWorld={() => { setArrivalFrom(null); setMapView("world"); }}
        onStart={start}
        completed={completed}
        algorithm={algorithm}
        onAlgorithm={setAlgorithm}
        arrivalFrom={arrivalFrom}
        onArrived={() => setArrivalFrom(null)}
        sound={sound}
        onSound={() => setSound(!sound)}
      />
    );
  if (algorithm === "array") return <ArrayLesson key={`${session}:${scene}`} mode={scene} onBack={back} onPlay={() => start("play")} onComplete={complete} onNext={chooseMap} />;
  if (algorithm === "bubble")
    return (
      <BubbleGame
        key={`${session}:${scene}:${input.join(",")}`}
        mode={scene}
        input={input}
        difficulty={difficulty}
        sound={sound}
        speed={speed}
        onBack={back}
        onPlay={() => start("play")}
        onChooseMap={chooseMap}
        onComplete={complete}
        onChange={updateArray}
        onSoundChange={setSound}
        onSpeedChange={setSpeed}
      />
    );
  if (scene === "demo")
    return (
      <DemoLesson
        key={`${session}:${difficulty}:${input.join(",")}`}
        input={input}
        difficulty={difficulty}
        onBack={back}
        onPlay={() => start("play")}
        onChange={updateArray}
        sound={sound}
        onSoundChange={setSound}
        speed={speed}
        onSpeedChange={setSpeed}
      />
    );
  return (
    <ExpeditionPlay
      key={`${session}:${difficulty}:${input.join(",")}`}
      input={input}
      difficulty={difficulty}
      sound={sound}
      onBack={back}
      onChooseMap={chooseMap}
      onComplete={complete}
      onChange={updateArray}
      onSoundChange={setSound}
    />
  );
}
