export interface DtoProductQuestion {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  productId: number;
  productName?: string;
  questionText: string;
  answerText?: string;
  answeredAt?: string;
  answered: boolean;
}

export interface DtoProductQuestionRequest {
  productId: number;
  questionText: string;
}

export interface DtoAnswerRequest {
  answerText: string;
}
