import { analyzeImageWithGemini, getShoppingRecommendations, getOutfitSuggestion } from '../ai';

// Mock fetch globally
global.fetch = jest.fn();

describe('ai.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    fetch.mockReset();
  });

  describe('analyzeImageWithGemini', () => {
    const mockSuccessResponse = {
      success: true,
      data: {
        name: 'Air Jordan 4 Retro Bred Reimagined',
        category: 'Scarpe Sportive/Sneakers',
        color: 'Nero Lucido/Rosso',
        brand: 'Nike Jordan',
        material: 'Pelle',
        season: 'Tutte le stagioni',
      },
    };

    it('successfully analyzes image and returns metadata', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      const result = await analyzeImageWithGemini('base64-image-data');

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'https://europe-west1-armadiodigitale.cloudfunctions.net/analyzeImage',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: 'base64-image-data',
            mimeType: 'image/jpeg',
          }),
        }
      );

      expect(result).toEqual({
        name: 'Air Jordan 4 Retro Bred Reimagined',
        category: 'Scarpe Sportive/Sneakers',
        mainColor: 'Nero Lucido/Rosso',
        brand: 'Nike Jordan',
        size: '',
      });
    });

    it('uses name from response instead of category', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      const result = await analyzeImageWithGemini('base64-image-data');

      expect(result.name).toBe('Air Jordan 4 Retro Bred Reimagined');
      expect(result.name).not.toBe(result.category);
    });

    it('falls back to category if name is missing', async () => {
      const responseWithoutName = {
        success: true,
        data: {
          category: 'T-Shirt',
          color: 'Bianco',
          brand: 'Nike',
          material: 'Cotone',
          season: 'Estate',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithoutName,
      });

      const result = await analyzeImageWithGemini('base64-image-data');

      expect(result.name).toBe('T-Shirt');
      expect(result.category).toBe('T-Shirt');
    });

    it('returns empty size when not provided', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      const result = await analyzeImageWithGemini('base64-image-data');

      expect(result.size).toBe('');
    });

    it('retries on 429 rate limit error', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => 'Rate limit exceeded',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuccessResponse,
        });

      const result = await analyzeImageWithGemini('base64-image-data');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result.name).toBe('Air Jordan 4 Retro Bred Reimagined');
    });

    it('throws error after max retries', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      });

      await expect(analyzeImageWithGemini('base64-image-data')).rejects.toThrow();
      expect(fetch).toHaveBeenCalledTimes(5);
    }, 30000); // Increased timeout: 5 retries with exponential backoff ~15s total

    it('handles API error response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Invalid image format',
        }),
      });

      await expect(analyzeImageWithGemini('base64-image-data')).rejects.toThrow(
        'Invalid image format'
      );
    }, 5000); // Timeout for single non-retry test

    it('handles network errors', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      await expect(analyzeImageWithGemini('base64-image-data')).rejects.toThrow();
      expect(fetch).toHaveBeenCalledTimes(5); // Should retry 5 times
    }, 30000); // Increased timeout: 5 retries with exponential backoff ~15s total

    it('maps color field to mainColor', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      const result = await analyzeImageWithGemini('base64-image-data');

      expect(result.mainColor).toBe('Nero Lucido/Rosso');
      expect(result).not.toHaveProperty('color');
    });

    it('provides default brand if missing', async () => {
      const responseWithoutBrand = {
        success: true,
        data: {
          name: 'Generic Shirt',
          category: 'T-Shirt',
          color: 'Bianco',
          material: 'Cotone',
          season: 'Estate',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithoutBrand,
      });

      const result = await analyzeImageWithGemini('base64-image-data');

      expect(result.brand).toBe('Generic');
    });
  });

  describe('getShoppingRecommendations', () => {
    it('returns recommendations on success', async () => {
      const mockRecommendations = [
        { title: 'Nike Air Max', url: 'https://example.com/1' },
        { title: 'Adidas Ultraboost', url: 'https://example.com/2' },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ recommendations: mockRecommendations }),
      });

      const result = await getShoppingRecommendations('sneakers rosse');

      expect(fetch).toHaveBeenCalledWith(
        'https://europe-west1-armadiodigitale.cloudfunctions.net/getShoppingRecommendations',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemDescription: 'sneakers rosse' }),
        }
      );

      expect(result).toEqual(mockRecommendations);
    });

    it('returns empty array on error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getShoppingRecommendations('sneakers rosse');

      expect(result).toEqual([]);
    });

    it('returns empty array when response is not ok', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await getShoppingRecommendations('sneakers rosse');

      expect(result).toEqual([]);
    });
  });

  describe('getOutfitSuggestion', () => {
    const mockItems = [
      { name: 'T-Shirt Bianca', category: 'T-Shirt', mainColor: 'Bianco' },
      { name: 'Jeans Blu', category: 'Jeans', mainColor: 'Blu' },
    ];

    it('generates outfit suggestion with user request', async () => {
      const mockSuggestion = 'Indossa la T-Shirt Bianca con i Jeans Blu per un look casual';

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: mockSuggestion }],
              },
            },
          ],
        }),
      });

      const result = await getOutfitSuggestion(mockItems, 'look casual estivo');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      expect(result).toBe(mockSuggestion);
    });

    it('includes inventory in prompt', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Suggestion' }] } }],
        }),
      });

      await getOutfitSuggestion(mockItems, 'outfit elegante');

      const callBody = JSON.parse(fetch.mock.calls[0][1].body);
      const userPrompt = callBody.contents[0].parts[0].text;

      expect(userPrompt).toContain('[T-Shirt Bianca T-Shirt Bianco]');
      expect(userPrompt).toContain('[Jeans Blu Jeans Blu]');
      expect(userPrompt).toContain('outfit elegante');
    });

    it('returns error message after max retries', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Error',
      });

      const result = await getOutfitSuggestion(mockItems, 'look sportivo');

      expect(fetch).toHaveBeenCalledTimes(5);
      expect(result).toBe("Errore nella comunicazione con l'AI. Riprova più tardi.");
    }, 30000); // Increased timeout: 5 retries with exponential backoff ~15s total

    it('retries on 429 rate limit', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => 'Rate limit',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'Suggestion' }] } }],
          }),
        });

      const result = await getOutfitSuggestion(mockItems, 'outfit casual');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toBe('Suggestion');
    }, 10000); // Increased timeout for retry delays

    it('returns default message if no suggestion generated', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [],
        }),
      });

      const result = await getOutfitSuggestion(mockItems, 'outfit formale');

      expect(result).toBe('Nessun suggerimento generato.');
    });
  });
});
