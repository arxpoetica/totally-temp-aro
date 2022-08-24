import React, { useState } from 'react'
import { Popover, Text, Button, Loader } from '@mantine/core'
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
        opened={popoverOpen}
        onClose={() => setPopoverOpen(false)}
        target={
          <Button
            leftIcon={<IconCalculator size={20} stroke={2}/>}
            color="yellow"
            onClick={() => executeRecalc(loggedInUserId, editingManagerId)}
          >
            Recalc
          </Button>
        }
        width={260}
        position="top"
        placement="center"
        withCloseButton
      >
        <div>
          <Text size="sm">
            Recalculation is required in order to apply the changes you made. It
            may take a few minutes...
          </Text>
        </div>
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
        if (requiresRecalc && !popoverOpen) {
          return setPopoverOpen(true)
        }
        setPopoverOpen(true)
        if (hasChanged) saveConfigurationToServer()
      }}
      disabled={regionSelectEnabled || recalculating}
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
    `}</style>
  </div>

}
