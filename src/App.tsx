import QuickForestGame from "./components/QuickForestGame";
import QueueGame from "./components/QueueGame";
import { useEffect, useState } from "react";
import CurriculumMap from "./components/CurriculumMap";
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
import { currentLesson, lessonAvailable, lessonUnlocked, nextLesson, readTrackProgress, regionForLesson, saveTrackProgress, type TrackId } from "./engine/learningTrack";
import ExpeditionPlay from "./components/ExpeditionPlay";
import type { Difficulty } from "./engine/quicksort";
import { gameAudio, readSoundPreference } from "./audio/gameAudio";
import { stopHaptics } from "./audio/gameFeedback";
import { useInterfaceAudio } from "./audio/useInterfaceAudio";
import { completeLinkedLevel, readLinkedLevelProgress, saveLinkedLevelProgress, type LinkedLevel, type LinkedTrackId } from "./engine/linkedCurriculum";
import GraphGame from "./components/GraphGame";
import GraphLesson from "./components/GraphLesson";
import TreeGame from "./components/TreeGame";
import type { TreeLessonId } from "./engine/tree";
import type { GraphDifficulty } from "./engine/graph";

export default function App() {
  useInterfaceAudio();
  const [scene, setScene] = useState<"map" | "demo" | "play">("map");
  const [completed, setCompleted] = useState(readTrackProgress);
  const [linkedLevels, setLinkedLevels] = useState(() => readLinkedLevelProgress(readTrackProgress()));
  const [linkedLevel, setLinkedLevel] = useState<LinkedLevel>(1);
  const [algorithm, setAlgorithm] = useState<TrackId>(() => currentLesson(readTrackProgress()).id);
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
    setCompleted(value => value[algorithm] ? value : { ...value, [algorithm]: true });
  }
  function start(mode: "demo" | "play") {
    if (!lessonAvailable(algorithm)) return;
    if (!lessonUnlocked(algorithm, completed)) return;
    gameAudio.unlock();
    gameAudio.play("enter");
    setSession((value) => value + 1);
    setLinkedLevel(algorithm === "linked-list" && mode === "play" ? 1 : algorithm === "linked-search" || algorithm === "linked-insertion" || algorithm === "linked-deletion" ? 2 : 3);
    setScene(mode);
  }
  function finishLinkedLevel() {
    const id = algorithm as LinkedTrackId;
    const next = completeLinkedLevel(linkedLevels, id, linkedLevel);
    setLinkedLevels(next);
    if (id !== "linked-list" || linkedLevel === 3) complete();
  }
  function back() {
    gameAudio.stop();
    stopHaptics();
    setScene("map");
  }
  function chooseMap() {
    const next = nextLesson(algorithm);
    if (next && lessonAvailable(next.id) && lessonUnlocked(next.id, completed)) setAlgorithm(next.id);
    back();
  }
  function updateArray(values: number[], level: Difficulty) {
    gameAudio.stop();
    stopHaptics();
    setInput(values);
    setDifficulty(level);
    setSession((value) => value + 1);
  }
  if (scene === "map") return <CurriculumMap completed={completed} algorithm={algorithm}
    onAlgorithm={setAlgorithm} onStart={start} sound={sound} onSound={() => changeSound(!sound)} />;
  if (algorithm === "quick") return <QuickForestGame key={`${session}:${scene}:${input.join(",")}`} mode={scene} input={input} difficulty={difficulty} sound={sound} speed={speed} onBack={back} onPlay={() => start("play")} onChooseMap={chooseMap} onComplete={complete} onChange={updateArray} onSoundChange={changeSound} onSpeedChange={setSpeed} />;
  if (algorithm === "queue") return <QueueGame key={`${session}:${scene}`} mode={scene} sound={sound} speed={speed} onBack={back} onPlay={()=>start("play")} onChooseMap={chooseMap} onComplete={complete} onSoundChange={changeSound} onSpeedChange={setSpeed}/>;
  if (algorithm === "stack") return <StackGame key={`${session}:${scene}`} mode={scene} sound={sound} speed={speed} onBack={back} onPlay={()=>start("play")} onChooseMap={chooseMap} onComplete={complete} onSoundChange={changeSound} onSpeedChange={setSpeed}/>;
  if (algorithm === "selection") return <SelectionGame key={`${session}:${scene}:${input.join(",")}`} mode={scene} input={input} difficulty={difficulty} sound={sound} speed={speed} onBack={back} onPlay={() => start("play")} onChooseMap={chooseMap} onComplete={complete} onChange={updateArray} onSoundChange={changeSound} onSpeedChange={setSpeed} />;
  if (algorithm === "insertion") return <InsertionGame key={`${session}:${scene}:${input.join(",")}`} mode={scene} input={input} difficulty={difficulty} sound={sound} speed={speed} onBack={back} onPlay={() => start("play")} onChooseMap={chooseMap} onComplete={complete} onChange={updateArray} onSoundChange={changeSound} onSpeedChange={setSpeed} />;
  if (regionForLesson(algorithm).id === "trees") return <TreeGame key={`${session}:${scene}:${algorithm}`} algorithm={algorithm as TreeLessonId} mode={scene} sound={sound} onSoundChange={changeSound} onBack={back} onPlay={() => start("play")} onChooseMap={chooseMap} onComplete={complete} />;
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
        onDemo={() => start("demo")}
        onChooseMap={chooseMap}
        onComplete={complete}
        onChange={updateArray}
        onSoundChange={changeSound}
        onSpeedChange={setSpeed}
      />
    );
  if (algorithm === "linked-list") return <LinkedListGame key={`${session}:${scene}:${linkedLevel}`} mode={scene} onDemo={() => start("demo")} level={linkedLevel} sound={sound} onSoundChange={changeSound} onBack={back} onPlay={() => start("play")} onChooseMap={chooseMap} onComplete={finishLinkedLevel} onNextLevel={() => { if (linkedLevel < 3) { setLinkedLevel((linkedLevel + 1) as LinkedLevel); setSession(value => value + 1); } }} />;
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
