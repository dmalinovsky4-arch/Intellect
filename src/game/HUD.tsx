import { useGame, hotspotNotes } from "./store";

export function HUD() {
  const phase = useGame((s) => s.phase);
  const nearby = useGame((s) => s.nearby);
  const activeNote = useGame((s) => s.activeNote);
  const dismissNote = useGame((s) => s.dismissNote);
  const setPhase = useGame((s) => s.setPhase);

  return (
    <div className="hud">
      <div className="controls">WASD to move &nbsp;·&nbsp; E to interact</div>

      {phase === "exploring" && nearby && !activeNote && (
        <div className="prompt">[E] {hotspotNotes[nearby].title}</div>
      )}

      {phase === "briefing" && (
        <Modal>
          <span className="tag">West Berlin · 16 August 1961</span>
          <h2>Briefing</h2>
          <p>
            The Wall went up three days ago. Your asset — codename <em>Klaus</em> — has microfilm on
            Soviet troop dispositions in the eastern sector. You are a CIA case officer working from
            Berlin Operations Base.
          </p>
          <p>
            Walk the block. Confirm the chalk signal on the lamppost. Clear your tail in a shop
            window. Then execute a brush pass at the newsstand.
          </p>
          <button onClick={() => setPhase("exploring")}>Begin</button>
        </Modal>
      )}

      {activeNote && (
        <Modal>
          <span className="tag">{activeNote.tag}</span>
          <h2>{activeNote.title}</h2>
          <p>{activeNote.body}</p>
          <button onClick={dismissNote}>Continue</button>
        </Modal>
      )}

      {phase === "ethicsChoice" && !activeNote && (
        <Modal>
          <span className="tag">Klaus · whispered</span>
          <h2>"They took my wife this morning."</h2>
          <p>
            "Please. If I go back across, I'm dead by Friday. Take me with you now — forget the
            film, forget the protocol." Your exfil plan is for next month. Moving now means burning
            three other assets who depend on your cover.
          </p>
          <button onClick={() => setPhase("epilogueExfil")}>Exfil Klaus now</button>
          <button onClick={() => setPhase("epilogueWalkAway")}>Walk away</button>
        </Modal>
      )}

      {phase === "epilogueExfil" && (
        <Modal>
          <span className="tag">Epilogue</span>
          <h2>You broke protocol.</h2>
          <p>
            Klaus lives. The microfilm is abandoned at the newsstand and later recovered by the
            Stasi. Three Berlin Operations Base assets are rolled up within a week. Historically,
            the network losses after 13 August 1961 were catastrophic — dozens of Western agents
            were stranded in the East. Individual lives saved often came at the price of collective
            intelligence capacity.
          </p>
          <button onClick={() => window.location.reload()}>Restart</button>
        </Modal>
      )}

      {phase === "epilogueWalkAway" && (
        <Modal>
          <span className="tag">Epilogue</span>
          <h2>You completed the pass.</h2>
          <p>
            The microfilm reaches Langley. It confirms three Soviet motor rifle divisions are NOT
            forward-deployed — a finding that quietly shapes Kennedy's response during the Berlin
            Crisis of autumn 1961. Klaus is arrested the next day. He is executed in 1963. This
            dilemma was real: case officers were trained to prioritize the mission, and many spent
            the rest of their lives asking whether they had been right to.
          </p>
          <button onClick={() => window.location.reload()}>Restart</button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="modal">
      <div className="card">{children}</div>
    </div>
  );
}
