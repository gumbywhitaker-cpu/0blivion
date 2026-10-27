import { STAGES } from '../../data/stages'
import Lighting from './Lighting'
import Chassis from './Chassis'
import CameraRig from './CameraRig'
import StageGroup from './StageGroup'
import MaterialFlowLines from './MaterialFlowLines'
import InfeedStation from './InfeedStation'
import DryingTunnel from './DryingTunnel'
import PulverizingRollers from './PulverizingRollers'
import ShakerTable from './ShakerTable'
import Rewinder from './Rewinder'

const STAGE_COMPONENTS = {
  infeed: InfeedStation,
  drying: DryingTunnel,
  pulverize: PulverizingRollers,
  shaker: ShakerTable,
  rewind: Rewinder,
}

export default function MachineScene({ hoveredId, onHover, onSelect }) {
  return (
    <>
      <CameraRig />
      <Lighting />
      <Chassis />
      <MaterialFlowLines />
      {STAGES.map((stage) => {
        const StageMesh = STAGE_COMPONENTS[stage.id]
        return (
          <StageGroup key={stage.id} stage={stage} hoveredId={hoveredId} onHover={onHover} onSelect={onSelect}>
            <StageMesh />
          </StageGroup>
        )
      })}
    </>
  )
}
