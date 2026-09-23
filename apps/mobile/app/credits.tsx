import { InfoScreen } from '../components/InfoScreen';
import { copy, creditBody } from '@rakshak/game-ui';

export default function CreditsScreen() {
  return <InfoScreen title={copy.credits} body={creditBody} />;
}
