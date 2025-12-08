import { withBotId } from 'botid/next/config';

const nextConfig = {
  reactCompiler: true,
};

export default withBotId(nextConfig);