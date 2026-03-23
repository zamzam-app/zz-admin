import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/outlet', () => {
    return HttpResponse.json([]);
  }),
];
