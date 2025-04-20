
export interface Assessment {
  product_id: string;
  product_name: string;
  url: string;
  adaptive_support: string;
  description: string;
  duration: number;
  remote_support: string;
  test_type: string[];
}

export interface RecommendationResponse {
  recommended_assessments: Assessment[];
  status: string;
  message: string;
}
