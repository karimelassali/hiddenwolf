import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/modal";
import { HowlSound } from "@/utils/sounds";

export default function PlayerActions({
  currentPlayer,
  roomInfo,
  players,
  onAction,
}) {
  const [open, setOpen] = useState(false);
  const [savedPlayer, setSavedPlayer] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [playerToSeeRole, setPlayerToSeeRole] = useState(null);

  const killPlayer = async (player) => {
    //Check if the target is saved
    const { data: savedPlayer, error: savedError } = await supabase
      .from("players")
      .select("id,name")
      .eq("id", player.id)
      .eq("is_saved", true)
      .single();

    if (savedPlayer) {
      setOpen(false);
      setSavedPlayer(savedPlayer);
      setModalOpen(true);

      console.log("player is saved");

      return;
    }

    //Kill the player in the room
    const { error } = await supabase
      .from("players")
      .update({ is_alive: false })
      .eq("id", player.id);
    //Update room wolf killed row
    const { error: wolfKilledError } = await supabase
      .from("rooms")
      .update({ wolf_killed: true })
      .eq("id", roomInfo?.id);

    if (error) {
      console.log(error);
    }
    wolfKilledError && console.log(wolfKilledError);
    console.log("wolf killed updated");
    console.log("player killed" + player.name);
    setOpen(false);
  };

  const voting = async (player) => {
    const { error } = await supabase.from("voting").insert({
      room_id: roomInfo.id,
      round: 1,
      voter_id: currentPlayer.id,
      voter_name: currentPlayer.name,
      voter_img: currentPlayer.img,
      voted_name: player.name,
      voted_id: player.id,
      voted_img: player.img,
    });

    if (error) {
      console.log(error);
    }
    console.log("voting updated");
    setOpen(false);
  };

  const savePlayer = async (player) => {
    const { error } = await supabase
      .from("players")
      .update({ is_saved: true })
      .eq("id", player.id);
    if (error) {
      console.log(error);
    }
    console.log("player saved updated");
    setOpen(false);
  };

  const seePlayer = async (player) => {
    const selectedPlayer = players.find((p) => p.id === player.id);
    setPlayerToSeeRole(selectedPlayer);
    setModalOpen(true);
    setOpen(false);
  };

  //Apply that   the player has done his action in is_action_done
  const applyActionDone = async () => {
    const closeDrawer = document.getElementById("close-drawer");
    closeDrawer.click();
    const { error } = await supabase
      .from("players")
      .update({ is_action_done: true })
      .eq("id", currentPlayer.id);
    if (error) {
      console.log(error);
    }
  };

  const howlSound = async () => {
    try {
      setOpen(false);
      const { error } = await supabase
        .from("rooms")
        .update({ sound: "howl" })
        .eq("id", roomInfo.id);
      if (error) {
        console.log(error);
      }
    } catch (error) {
      console.log("error");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Drawer>
        {currentPlayer &&
          currentPlayer.is_alive &&
          !currentPlayer.is_action_done && (
            <DrawerTrigger>
              {/* Role-specific buttons */}
              {currentPlayer?.role === "wolf" && roomInfo.stage === "night" && (
                <>
                  <Button variant="destructive" onClick={() => setOpen(true)}>
                    Kill
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      howlSound();
                    }}
                  >
                    Howl
                  </Button>
                </>
              )}

              {currentPlayer?.role === "seer" && roomInfo.stage === "night" && (
                <Button variant="outline" onClick={() => setOpen(true)}>
                  See
                </Button>
              )}

              {currentPlayer?.role === "doctor" &&
                roomInfo.stage === "night" && (
                  <Button variant="outline" onClick={() => setOpen(true)}>
                    Save
                  </Button>
                )}

              {/* Vote button for day stage */}
              {roomInfo.stage === "day" && (
                <Button variant="outline" onClick={() => setOpen(true)}>
                  Vote
                </Button>
              )}
            </DrawerTrigger>
          )}

        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Choose a player</DrawerTitle>
          </DrawerHeader>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {players &&
              players
                ?.filter((player) => {
                  if (!player.is_alive) return false; // Show only alive players

                  // 🐺 Wolf cannot target himself at night
                  if (
                    currentPlayer?.role === "wolf" &&
                    roomInfo.stage === "night"
                  ) {
                    return player.id !== currentPlayer.id;
                  }

                  // 🔮 Seer cannot target himself
                  if (
                    currentPlayer?.role === "seer" &&
                    roomInfo.stage === "night"
                  ) {
                    return player.id !== currentPlayer.id;
                  }

                  // 👨‍🌾 Villager & other roles can't vote for themselves during the day
                  if (
                    roomInfo.stage === "day" &&
                    currentPlayer?.id === player.id
                  ) {
                    return false;
                  }

                  // 🧑‍⚕️ Doctor can save anyone (including himself)
                  return true;
                })
                .map((player) => (
                  <div
                    key={player.id}
                    className="bg-white dark:bg-input/30 p-4 rounded-md shadow-sm"
                  >
                    <h3 className="text-lg font-semibold">{player.name}</h3>

                    {/* 🐺 Wolf Kill Button */}
                    {currentPlayer?.role === "wolf" &&
                      roomInfo.stage === "night" &&
                      !roomInfo.wolf_killed && (
                        <Button
                          variant="kill"
                          onClick={() => {
                            killPlayer(player);
                            applyActionDone();
                          }}
                        >
                          Kill
                        </Button>
                      )}

                    {/* 🔮 Seer See Button */}
                    {currentPlayer?.role === "seer" &&
                      roomInfo.stage === "night" && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            seePlayer(player);
                            applyActionDone();
                          }}
                        >
                          See
                        </Button>
                      )}

                    {/* 🧑‍⚕️ Doctor Save Button */}
                    {currentPlayer?.role === "doctor" &&
                      roomInfo.stage === "night" && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            savePlayer(player);
                            applyActionDone();
                          }}
                        >
                          Save
                        </Button>
                      )}

                    {/* 🗳️ Voting button for day */}
                    {roomInfo.stage === "day" && (
                      <Button
                        variant="red"
                        onClick={() => {
                          voting(player);
                          applyActionDone();
                        }}
                      >
                        Vote
                      </Button>
                    )}
                  </div>
                ))}
          </div>

          <DrawerFooter>
            <DrawerClose>
              <Button id="close-drawer" variant="outline">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Modal logic for seer/doctor results */}
      {modalOpen && (
        <Modal
          prop={
            savedPlayer
              ? `${savedPlayer?.name} is saved`
              : playerToSeeRole?.name +
                " is " +
                (playerToSeeRole?.role === "wolf" ? "the wolf" : "not the wolf")
          }
          onCloseModal={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
