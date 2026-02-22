import apiClient from './axios';
import { Form } from '../../types/forms';

/** Strip client-only fields and send only properties allowed by the backend QuestionDto. */
function questionsForApi(questions: Form['questions']) {
  return questions.map((q) => ({
    type: q.type,
    title: q.title,
    isRequired: q.isRequired,
    ...(q.hint != null && { hint: q.hint }),
    ...(q.options != null && { options: q.options }),
    ...(q.maxRatings != null && { maxRatings: q.maxRatings }),
    ...(q.starStep != null && { starStep: q.starStep }),
  }));
}

export const formsApi = {
  getForms: async (): Promise<Form[]> => {
    const { data } = await apiClient.get('/forms');
    return data?.data || data;
  },

  getForm: async (id: string): Promise<Form> => {
    const { data } = await apiClient.get(`/forms/${id}`);
    return data?.data || data;
  },

  createForm: async (): Promise<Form> => {
    const { data } = await apiClient.post('/forms', {
      title: 'Untitled Form',
      questions: [],
    });
    return data?.data || data;
  },

  updateForm: async (id: string, form: Partial<Form>): Promise<Form> => {
    const payload =
      form.questions != null ? { ...form, questions: questionsForApi(form.questions) } : form;
    const { data } = await apiClient.patch(`/forms/${id}`, payload);
    return data?.data || data;
  },

  deleteForm: async (id: string) => {
    await apiClient.delete(`/forms/${id}`);
  },
};
