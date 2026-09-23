import { InfoScreen } from '../components/InfoScreen';
import { copy } from '@rakshak/game-ui';

export default function PrivacyScreen() {
  return <InfoScreen title={copy.privacy} body={copy.privacyBody} />;
}
