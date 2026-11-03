import { loadProviderHostConfig, checkProviderHostConfig } from './provider-host-config.mjs';
import { savePrivate, encodeConfig } from './provider-private-files.mjs';
import { tokenAtomic, tokenDisplay } from './provider-deployment.mjs';
import { isAddress } from 'viem';

export async function editProviderConfiguration(path, ui, deployment) {
  const values = await loadProviderHostConfig(path);
  ui.heading('Change configuration');
  ui.write("'prices' Change the service prices\n'duration' Change maximum delivery time for new Orders\n'payout' Change the receiving account (requires new profile qualification)\n'q' Return without changes");
  const group = await ui.ask('Choose one group');
  if (group === 'q' || !['prices', 'payout','duration'].includes(group)) return false;
  async function ask(key, prompt, secret = false) {
    const value = await ui.ask(`${prompt}${secret ? ' (hidden; Enter keeps the saved password)' : ` (Enter keeps '${values[key]}', 'q' cancels)`}`, { secret });
    if (!secret && value === 'q') throw new Error('Configuration change cancelled');
    if (value) values[key] = value;
  }
  if (group === 'payout') {
    await ask('AGENT_NATIVE_SELLER', 'Your receiving account on the configured network');
    if (!isAddress(values.AGENT_NATIVE_SELLER)) throw new Error('Payout must be a valid account address');
  }
  if (group === 'prices') {
    for (const [key, prompt] of [['AGENT_NATIVE_BASE_AMOUNT', 'Base price per order'], ['AGENT_NATIVE_UNIT_PRICE', 'Price per usage unit']]) {
      const existing = deployment ? tokenDisplay(values[key], deployment.tokenDecimals) : values[key];
      const amount = await ui.ask(`${prompt} (${deployment?.tokenSymbol || 'atomic token units'}; Enter keeps '${existing}', 'q' cancels)`);
      if (amount === 'q') throw new Error('Configuration change cancelled');
      if (amount) values[key] = deployment ? tokenAtomic(amount, deployment.tokenDecimals) : amount;
    }
  }
  if(group==='duration'){
    ui.write('Time starts at Order creation, including payment/acceptance waits. Only new Orders change.');
    const answer=await ui.ask(`Maximum delivery time in seconds, or 'default' (Enter keeps '${values.AGENT_NATIVE_SERVICE_WINDOW_SECONDS||'default'}', 'q' cancels)`);
    if(answer==='q')return false;
    if(answer==='default')delete values.AGENT_NATIVE_SERVICE_WINDOW_SECONDS;
    else if(answer)values.AGENT_NATIVE_SERVICE_WINDOW_SECONDS=answer;
  }
  checkProviderHostConfig(values, Date.now(), { allowMissingIdentifiers: true, requireFreshOffer: false });
  if (await ui.ask("Type 'save' to keep these changes, or 'q' to cancel") !== 'save') return false;
  await savePrivate(path, encodeConfig(values));
  ui.write("Application configuration saved; its own runtime command will verify and reload it if needed.");
  return true;
}
