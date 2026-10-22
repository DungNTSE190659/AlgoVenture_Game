import QueueGame from "./components/QueueGame";
import { useEffect, useState } from "react";
import AdventureMap from "./components/AdventureMap";
import WorldMap from "./components/WorldMap";
import StackGame from "./components/StackGame";
import InsertionGame from "./components/InsertionGame";
import MergeGame from "./components/MergeGame";
import SelectionGame from "./components/SelectionGame";
import DemoLesson from "./components/DemoLesson";
import BubbleGame from "./components/BubbleGame";
import LinkedListGame from "./components/LinkedListGame";
import LinkedAlgorithmGame from "./components/LinkedAlgorithmGame";
import LinearSearchGame from "./components/LinearSearchGame";
import LinearSearchPlay from "./components/LinearSearchPlay";
import BinarySearchGame from "./components/BinarySearchGame";
import { arrayRouteForLesson, currentRouteLesson, currentLesson, lessonAvailable, lessonUnlocked, nextLesson, readTrackProgress, regionComplete, regionForLesson, REGIONS, regionUnlocked, saveTrackProgress, type ArrayRouteId, type RegionId, type TrackId } from "./engine/learningTrack";
import ExpeditionPlay from "./components/ExpeditionPlay";
import type { Difficulty } from "./engine/quicksort";
import { gameAudio, readSoundPreference } from "./audio/gameAudio";
import { stopHaptics } from "./audio/gameFeedback";
import { useInterfaceAudio } from "./audio/useInterfaceAudio";
import { completeLinkedLevel, linkedLevelUnlocked, readLinkedLevelProgress, saveLinkedLevelProgress, type LinkedLevel, type LinkedTrackId } from "./engine/linkedCurriculum";
import GraphGame from "./components/GraphGame";
import GraphLesson from "./components/GraphLesson";
import type { GraphDifficulty } from "./engine/graph";

export default function App() {
  useInterfaceAudio();
  const [scene, setScene] = useState<"map" | "demo" | "play">("map");
  const [mapView, setMapView] = useState<"world" | "region">("world");
  const [region, setRegion] = useState<RegionId>(() => regionForLesson(currentLesson(readTrackProgress()).id).id);
  const [worldLocation, setWorldLocation] = useState<RegionId>(() => regionForLesson(currentLesson(readTrackProgress()).id).id);
  const [worldArrival, setWorldArrival] = useState<RegionId | null>(null);
  const [completed, setCompleted] = useState(readTrackProgress);
  const [linkedLevels, setLinkedLevels] = useState(() => readLinkedLevelProgress(readTrackProgress()));
  const [linkedLevel, setLinkedLevel] = useState<LinkedLevel>(1);
  const [arrivalFrom, setArrivalFrom] = useState<TrackId | null>(null);
  const [algorithm, setAlgorithm] = useState<TrackId>(() => currentLesson(readTrackProgress()).id);
  const [arrayRoute, setArrayRoute] = useState<ArrayRouteId>(() => arrayRouteForLesson(currentLesson(readTrackProgress()).id)?.id ?? "sort");
  const [input, setInput] = useState([8, 3, 6, 2, 5]);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [graphDifficulty, setGraphDifficulty] = useState<GraphDifficulty>("tutorial");
  const [sound, setSound] = useState(readSoundPreference);
  const [speed, setSpeed] = useState(1);
  const [session, setSession] = useState(0);
  function changeSound(enabled: boolean) {
    gameAudio.setEnabled(enabled);
    setSound(enabled);
    if (enabled) { gameAudio.unlock(); gameAudio.play("sound-on"); }
  }
  useEffect(() => {
    gameAudio.setEnabled(sound);
  }, [sound]);
  useEffect(() => { saveTrackProgress(completed); }, [completed]);
  useEffect(() => { saveLinkedLevelProgress(linkedLevels); }, [linkedLevels]);
  useEffect(() => {
    const stop = () => { if (document.hidden) { gameAudio.stop(); stopHaptics(); } };
    document.addEventListener("visibilitychange", stop);
    return () => { document.removeEventListener("visibilitychange", stop); stopHaptics(); };
  }, []);
  function complete() {
    if (!lessonUnlocked(algorithm, completed)) return;
    if (!completed[algorithm]) setArrivalFrom(algorithm);
    setCompleted(value => value[algorithm] ? value : { ...value, [algorithm]: true });
  }
  function start(mode: "demo" | "play") {
    if (!lessonAvailable(algorithm)) return;
    if (!lessonUnlocked(algorithm, completed)) return;
    gameAudio.unlock();
    gameAudio.play("enter");
    setSession((value) => value + 1);
    setLinkedLevel(algorithm === "linked-search" || algorithm === "linked-insertion" || algorithm === "linked-deletion" ? 2 : 3);
    setScene(mode);
  }
  function startLinkedLevel(id: LinkedTrackId, level: LinkedLevel) {
    if (!lessonAvailable(id) || !lessonUnlocked(id, completed) || !linkedLevelUnlocked(id, level, linkedLevels)) return;
    gameAudio.unlock();
    gameAudio.play("enter");
    setAlgorithm(id);
    setLinkedLevel(level);
    setSession(value => value + 1);
    setScene("play");
  }
  function finishLinkedLevel() {
    const id = algorithm as LinkedTrackId;
    const next = completeLinkedLevel(linkedLevels, id, linkedLevel);
    setLinkedLevels(next);
    complete();
  }
  function back() {
    gameAudio.stop();
    stopHaptics();
    setMapView("region");
    setScene("map");
  }
  function chooseMap() {
    const next = nextLesson(algorithm);
    if (arrivalFrom && next && regionComplete(region, completed) && regionForLesson(next.id).id !== region && lessonUnlocked(next.id, completed)) {
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
    const lesson = id === "arrays" ? currentRouteLesson(arrayRoute, completed)
      : territory.lessons.find(item => !completed[item.id]) ?? territory.lessons[territory.lessons.length - 1];
    setRegion(id);
    setAlgorithm(lesson.id);
    setArrivalFrom(null);
    setMapView("region");
    setWorldLocation(id);
  }
  function changeArrayRoute(id: ArrayRouteId) {
    if (id === arrayRoute) return;
    gameAudio.stop();
    gameAudio.unlock();
    gameAudio.play(id === "search" ? "topic-next" : "topic-prev");
    setArrayRoute(id);
    setAlgorithm(currentRouteLesson(id, completed).id);
    setArrivalFrom(null);
  }
  function updateArray(values: number[], level: Difficulty) {
    gameAudio.stop();
    stopHaptics();
    setInput(values);
    setDifficulty(level);
    setSession((value) => value + 1);
  }
  if (scene === "map" && mapView === "world") return <WorldMap completed={completed} sound={sound} onSound={() => changeSound(!sound)} onEnter={enterRegion} location={worldLocation} onLocation={setWorldLocation} arrivalFrom={worldArrival} onArrived={() => setWorldArrival(null)} />;
  if (scene === "map")
    return (
      <AdventureMap
        key={`${region}:${region === "arrays" ? arrayRoute : "main"}`}
        region={region}
        arrayRoute={arrayRoute}
        onArrayRoute={changeArrayRoute}
        linkedLevels={linkedLevels}
        onLinkedLevel={startLinkedLevel}
        onWorld={() => { setArrivalFrom(null); setMapView("world"); }}
        onStart={start}
        completed={completed}
        algorithm={algorithm}
        onAlgorithm={setAlgorithm}
        arrivalFrom={arrivalFrom}
        onArrived={() => setArrivalFrom(null)}
        sound={sound}
        onSound={() => changeSound(!sound)}
      />
    );
  if (algorithm === "queue") return <QueueGame key={`${session}:${scene}`} mode={scene} sound={sound} speed={speed} onBack={back} onPlay={()=>start("play")} onChooseMap={chooseMap} onComplete={complete} onSoundChange={changeSound} onSpeedChange={setSpeed}/>;
  if (algorithm === "stack") return <StackGame key={`${session}:${scene}`} mode={scene} sound={sound} speed={speed} onBack={back} onPlay={()=>start("play")} onChooseMap={chooseMap} onComplete={complete} onSoundChange={changeSound} onSpeedChange={setSpeed}/>;
  if (algorithm === "selection") return <SelectionGame key={`${session}:${scene}:${input.join(",")}`} mode={scene} input={input} difficulty={difficulty} sound={sound} speed={speed} onBack={back} onPlay={() => start("play")} onChooseMap={chooseMap} onComplete={complete} onChange={updateArray} onSoundChange={changeSound} onSpeedChange={setSpeed} />;
  if (algorithm === "insertion") return <InsertionGame key={`${session}:${scene}:${input.join(",")}`} mode={scene} input={input} difficulty={difficulty} sound={sound} speed={speed} onBack={back} onPlay={() => start("play")} onChooseMap={chooseMap} onComplete={complete} onChange={updateArray} onSoundChange={changeSound} onSpeedChange={setSpeed} />;
  if (algorithm === "merge") return <MergeGame key={`${session}:${scene}:${input.join(",")}`} mode={scene} input={input} difficulty={difficulty} sound={sound} speed={speed} onBack={back} onPlay={() => start("play")} onChooseMap={chooseMap} onComplete={complete} onChange={updateArray} onSoundChange={changeSound} onSpeedChange={setSpeed} />;
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
        onSoundChange={changeSound}
        onSpeedChange={setSpeed}
      />
    );
  if (algorithm === "linked-list") return <LinkedListGame key={`${session}:${scene}:${linkedLevel}`} mode={scene} level={linkedLevel} sound={sound} onSoundChange={changeSound} onBack={back} onPlay={() => start("play")} onChooseMap={chooseMap} onComplete={finishLinkedLevel} onNextLevel={() => { if (linkedLevel < 3) { setLinkedLevel((linkedLevel + 1) as LinkedLevel); setSession(value => value + 1); } }} />;
  if (regionForLesson(algorithm).id === "linear-structures") return <LinkedAlgorithmGame mode={scene} onPlay={() => start("play")} key={`${session}:${scene}:${linkedLevel}`} algorithm={algorithm as Exclude<LinkedTrackId, "linked-list">} level={linkedLevel} sound={sound} onSoundChange={changeSound} onBack={back} onChooseMap={chooseMap} onComplete={finishLinkedLevel} onNextLevel={() => { if (linkedLevel < 3) { setLinkedLevel((linkedLevel + 1) as LinkedLevel); setSession(value => value + 1); } }} />;
  if (algorithm === "binary") return <BinarySearchGame key={`${session}:${scene}`} mode={scene} sound={sound} speed={speed} onBack={back} onPlay={() => start("play")} onChooseMap={chooseMap} onComplete={complete} onSoundChange={changeSound} onSpeedChange={setSpeed} />;
  if (algorithm === "linear") return scene === "play"
    ? <LinearSearchPlay key={session} sound={sound} onBack={back} onChooseMap={chooseMap} onComplete={complete} onSoundChange={changeSound} />
    : <LinearSearchGame key={`${session}:${scene}`} mode={scene} sound={sound} speed={speed} onBack={back} onPlay={() => start("play")} onChooseMap={chooseMap} onComplete={complete} onSoundChange={changeSound} onSpeedChange={setSpeed} />;
  if (algorithm === "bfs")
    return (
      scene === "demo" ? (
        <GraphLesson
          key={`${session}:${graphDifficulty}`}
          difficulty={graphDifficulty}
          onBack={back}
          onPlay={() => start("play")}
          onChange={setGraphDifficulty}
          sound={sound}
          onSoundChange={changeSound}
        />
      ) : (
        <GraphGame
          key={`${session}:${graphDifficulty}`}
          difficulty={graphDifficulty}
          sound={sound}
          onBack={back}
          onChooseMap={chooseMap}
          onComplete={complete}
          onChange={setGraphDifficulty}
          onSoundChange={changeSound}
        />
      )
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
        onSoundChange={changeSound}
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
      onSoundChange={changeSound}
    />
  );
}
