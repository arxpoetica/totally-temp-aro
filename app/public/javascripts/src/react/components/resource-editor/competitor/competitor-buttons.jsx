import React, { useState } from 'react'
import { Popover, CloseButton, Button, Loader } from '@mantine/core'
import { IconArrowBack, IconCalculator, IconDeviceFloppy } from '@tabler/icons'
import { RECALC_STATES } from './competitor-shared'

export const CompetitorButtons = props => {

  const [popoverOpen, setPopoverOpen] = useState(false)

  const {
    recalcState,
    exitEditingMode,
    executeRecalc,
    loggedInUserId,
    editingManagerId,
    hasChanged,
    saveConfigurationToServer,
    regionSelectEnabled,
  } = props

  const recalculating = recalcState === RECALC_STATES.RECALCULATING
  const requiresRecalc = recalcState === RECALC_STATES.DIRTY

  return <div className="buttons">
    <Button
      onClick={exitEditingMode}
      leftIcon={<IconArrowBack size={20} stroke={2}/>}
      variant="subtle"
      color="red"
      disabled={recalculating}
    >
      Discard changes
    </Button>
    {requiresRecalc &&
      <Popover
        width={260}
        position="top"
        placement="center"
        opened={popoverOpen}
        closeOnClickOutside={false}
      >
        <Popover.Target>
          <Button
            leftIcon={<IconCalculator size={20} stroke={2}/>}
            color="yellow"
            onClick={() => {
              executeRecalc(loggedInUserId, editingManagerId)
              setPopoverOpen(false)
            }}
          >
            Recalc
          </Button>
        </Popover.Target>
        <Popover.Dropdown>
          <div className="popover-dropdown">
            Recalculation is required in order to apply the
            changes you made. It may take a few minutes...
            <CloseButton
              aria-label="Close message"
              onClick={() => setPopoverOpen(false)}
            />
          </div>
        </Popover.Dropdown>
      </Popover>
    }
    {recalculating &&
      <Button
        leftIcon={<Loader/>}
        color="yellow"
        loading={recalculating}
      >
        Recalculating...
      </Button>
    }
    <Button
      leftIcon={<IconDeviceFloppy size={20} stroke={2}/>}
      onClick={() => {
        setPopoverOpen(true)
        saveConfigurationToServer()
      }}
      disabled={regionSelectEnabled || recalculating || !hasChanged}
    >
      Save
    </Button>
    <style jsx>{`
      .buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin: 15px 0 0;
      }
      .popover-dropdown {
        display: flex;
        align-items: center;
      }
    `}</style>
  </div>

}
