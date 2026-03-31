import { app } from './app.js';

const port = 3001;

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
