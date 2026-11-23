import type { BillingCycle } from '../planos'
import type { Idioma } from '../i18n-global/idiomas'
import { consultarPrecoAprovadoV1 } from './stripe/catalogo-v1-aprovado'

/** Tabela de REFERENCIA copiada do catalogo aprovado para Paddle Live.
 * Nao cria checkout, nao autoriza pagamentos nem altera cobranca.
 * O pais selecionado no navegador NUNCA deve ser usado para decidir o valor real a cobrar.
 */
/** Mercados marcados allow_sales=true na consulta Paddle Sandbox de 16/11/2026.
 * Esta lista NAO habilita pagamentos: exige aprovacao e validacao do checkout por mercado.
 */
export const PAISES_REGIONAIS = [
  'BR', 'AD', 'AE', 'AG', 'AI', 'AL', 'AM', 'AO', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ', 'BA',
  'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BS', 'BT', 'BV',
  'BW', 'BZ', 'CA', 'CC', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CV', 'CW', 'CX',
  'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI',
  'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN',
  'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM', 'HN', 'HR', 'HU', 'ID', 'IE', 'IL',
  'IM', 'IN', 'IO', 'IQ', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN',
  'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'MA', 'MC',
  'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW',
  'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA',
  'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO',
  'RS', 'RW', 'SA', 'SB', 'SC', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SR', 'ST',
  'SV', 'SX', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT',
  'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VG', 'VI', 'VN', 'VU', 'WF',
  'WS', 'XK', 'YT', 'ZA', 'ZM',
] as const
export type PaisRegional = typeof PAISES_REGIONAIS[number] | 'OUTROS'
export type PlanoRegional = 'free' | 'minipage' | 'agenda' | 'loja' | 'essencial' | 'equipe'
type Preco = { moeda: 'USD' | 'EUR'; centavos: number }
type Tabela = Record<Exclude<PlanoRegional, 'free'>, Record<string, Record<BillingCycle, Preco>>>

const CATALOGO: Tabela = {
  "minipage": {
    "PY": {
      "mensal": {
        "moeda": "USD",
        "centavos": 390
      },
      "anual": {
        "moeda": "USD",
        "centavos": 3890
      }
    },
    "BO": {
      "mensal": {
        "moeda": "USD",
        "centavos": 390
      },
      "anual": {
        "moeda": "USD",
        "centavos": 3890
      }
    },
    "HN": {
      "mensal": {
        "moeda": "USD",
        "centavos": 390
      },
      "anual": {
        "moeda": "USD",
        "centavos": 3890
      }
    },
    "NI": {
      "mensal": {
        "moeda": "USD",
        "centavos": 390
      },
      "anual": {
        "moeda": "USD",
        "centavos": 3890
      }
    },
    "CO": {
      "mensal": {
        "moeda": "USD",
        "centavos": 490
      },
      "anual": {
        "moeda": "USD",
        "centavos": 4890
      }
    },
    "AR": {
      "mensal": {
        "moeda": "USD",
        "centavos": 490
      },
      "anual": {
        "moeda": "USD",
        "centavos": 4890
      }
    },
    "PE": {
      "mensal": {
        "moeda": "USD",
        "centavos": 490
      },
      "anual": {
        "moeda": "USD",
        "centavos": 4890
      }
    },
    "GT": {
      "mensal": {
        "moeda": "USD",
        "centavos": 490
      },
      "anual": {
        "moeda": "USD",
        "centavos": 4890
      }
    },
    "SV": {
      "mensal": {
        "moeda": "USD",
        "centavos": 490
      },
      "anual": {
        "moeda": "USD",
        "centavos": 4890
      }
    },
    "BZ": {
      "mensal": {
        "moeda": "USD",
        "centavos": 490
      },
      "anual": {
        "moeda": "USD",
        "centavos": 4890
      }
    },
    "MX": {
      "mensal": {
        "moeda": "USD",
        "centavos": 590
      },
      "anual": {
        "moeda": "USD",
        "centavos": 5890
      }
    },
    "CL": {
      "mensal": {
        "moeda": "USD",
        "centavos": 590
      },
      "anual": {
        "moeda": "USD",
        "centavos": 5890
      }
    },
    "CR": {
      "mensal": {
        "moeda": "USD",
        "centavos": 690
      },
      "anual": {
        "moeda": "USD",
        "centavos": 6890
      }
    },
    "PA": {
      "mensal": {
        "moeda": "USD",
        "centavos": 690
      },
      "anual": {
        "moeda": "USD",
        "centavos": 6890
      }
    },
    "ES": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 790
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 7890
      }
    },
    "PT": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 790
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 7890
      }
    },
    "DE": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 890
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 8890
      }
    },
    "FR": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 890
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 8890
      }
    },
    "US": {
      "mensal": {
        "moeda": "USD",
        "centavos": 890
      },
      "anual": {
        "moeda": "USD",
        "centavos": 8890
      }
    }
  },
  "agenda": {
    "PY": {
      "mensal": {
        "moeda": "USD",
        "centavos": 590
      },
      "anual": {
        "moeda": "USD",
        "centavos": 5890
      }
    },
    "BO": {
      "mensal": {
        "moeda": "USD",
        "centavos": 590
      },
      "anual": {
        "moeda": "USD",
        "centavos": 5890
      }
    },
    "HN": {
      "mensal": {
        "moeda": "USD",
        "centavos": 590
      },
      "anual": {
        "moeda": "USD",
        "centavos": 5890
      }
    },
    "NI": {
      "mensal": {
        "moeda": "USD",
        "centavos": 590
      },
      "anual": {
        "moeda": "USD",
        "centavos": 5890
      }
    },
    "CO": {
      "mensal": {
        "moeda": "USD",
        "centavos": 790
      },
      "anual": {
        "moeda": "USD",
        "centavos": 7890
      }
    },
    "AR": {
      "mensal": {
        "moeda": "USD",
        "centavos": 790
      },
      "anual": {
        "moeda": "USD",
        "centavos": 7890
      }
    },
    "PE": {
      "mensal": {
        "moeda": "USD",
        "centavos": 790
      },
      "anual": {
        "moeda": "USD",
        "centavos": 7890
      }
    },
    "GT": {
      "mensal": {
        "moeda": "USD",
        "centavos": 790
      },
      "anual": {
        "moeda": "USD",
        "centavos": 7890
      }
    },
    "SV": {
      "mensal": {
        "moeda": "USD",
        "centavos": 790
      },
      "anual": {
        "moeda": "USD",
        "centavos": 7890
      }
    },
    "BZ": {
      "mensal": {
        "moeda": "USD",
        "centavos": 790
      },
      "anual": {
        "moeda": "USD",
        "centavos": 7890
      }
    },
    "MX": {
      "mensal": {
        "moeda": "USD",
        "centavos": 990
      },
      "anual": {
        "moeda": "USD",
        "centavos": 9890
      }
    },
    "CL": {
      "mensal": {
        "moeda": "USD",
        "centavos": 990
      },
      "anual": {
        "moeda": "USD",
        "centavos": 9890
      }
    },
    "CR": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1190
      },
      "anual": {
        "moeda": "USD",
        "centavos": 11890
      }
    },
    "PA": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1190
      },
      "anual": {
        "moeda": "USD",
        "centavos": 11890
      }
    },
    "ES": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 1190
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 11890
      }
    },
    "PT": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 1190
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 11890
      }
    },
    "DE": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 1390
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 13890
      }
    },
    "FR": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 1390
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 13890
      }
    },
    "US": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1390
      },
      "anual": {
        "moeda": "USD",
        "centavos": 13890
      }
    }
  },
  "loja": {
    "PY": {
      "mensal": {
        "moeda": "USD",
        "centavos": 790
      },
      "anual": {
        "moeda": "USD",
        "centavos": 7890
      }
    },
    "BO": {
      "mensal": {
        "moeda": "USD",
        "centavos": 790
      },
      "anual": {
        "moeda": "USD",
        "centavos": 7890
      }
    },
    "HN": {
      "mensal": {
        "moeda": "USD",
        "centavos": 790
      },
      "anual": {
        "moeda": "USD",
        "centavos": 7890
      }
    },
    "NI": {
      "mensal": {
        "moeda": "USD",
        "centavos": 790
      },
      "anual": {
        "moeda": "USD",
        "centavos": 7890
      }
    },
    "CO": {
      "mensal": {
        "moeda": "USD",
        "centavos": 990
      },
      "anual": {
        "moeda": "USD",
        "centavos": 9890
      }
    },
    "AR": {
      "mensal": {
        "moeda": "USD",
        "centavos": 990
      },
      "anual": {
        "moeda": "USD",
        "centavos": 9890
      }
    },
    "PE": {
      "mensal": {
        "moeda": "USD",
        "centavos": 990
      },
      "anual": {
        "moeda": "USD",
        "centavos": 9890
      }
    },
    "GT": {
      "mensal": {
        "moeda": "USD",
        "centavos": 990
      },
      "anual": {
        "moeda": "USD",
        "centavos": 9890
      }
    },
    "SV": {
      "mensal": {
        "moeda": "USD",
        "centavos": 990
      },
      "anual": {
        "moeda": "USD",
        "centavos": 9890
      }
    },
    "BZ": {
      "mensal": {
        "moeda": "USD",
        "centavos": 990
      },
      "anual": {
        "moeda": "USD",
        "centavos": 9890
      }
    },
    "MX": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1190
      },
      "anual": {
        "moeda": "USD",
        "centavos": 11890
      }
    },
    "CL": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1190
      },
      "anual": {
        "moeda": "USD",
        "centavos": 11890
      }
    },
    "CR": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1390
      },
      "anual": {
        "moeda": "USD",
        "centavos": 13890
      }
    },
    "PA": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1390
      },
      "anual": {
        "moeda": "USD",
        "centavos": 13890
      }
    },
    "ES": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 1590
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 15790
      }
    },
    "PT": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 1590
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 15790
      }
    },
    "DE": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 1790
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 17790
      }
    },
    "FR": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 1790
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 17790
      }
    },
    "US": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1790
      },
      "anual": {
        "moeda": "USD",
        "centavos": 17790
      }
    }
  },
  "essencial": {
    "PY": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1090
      },
      "anual": {
        "moeda": "USD",
        "centavos": 10890
      }
    },
    "BO": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1090
      },
      "anual": {
        "moeda": "USD",
        "centavos": 10890
      }
    },
    "HN": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1090
      },
      "anual": {
        "moeda": "USD",
        "centavos": 10890
      }
    },
    "NI": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1090
      },
      "anual": {
        "moeda": "USD",
        "centavos": 10890
      }
    },
    "CO": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1390
      },
      "anual": {
        "moeda": "USD",
        "centavos": 13890
      }
    },
    "AR": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1390
      },
      "anual": {
        "moeda": "USD",
        "centavos": 13890
      }
    },
    "PE": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1390
      },
      "anual": {
        "moeda": "USD",
        "centavos": 13890
      }
    },
    "GT": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1390
      },
      "anual": {
        "moeda": "USD",
        "centavos": 13890
      }
    },
    "SV": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1390
      },
      "anual": {
        "moeda": "USD",
        "centavos": 13890
      }
    },
    "BZ": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1390
      },
      "anual": {
        "moeda": "USD",
        "centavos": 13890
      }
    },
    "MX": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1590
      },
      "anual": {
        "moeda": "USD",
        "centavos": 15790
      }
    },
    "CL": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1590
      },
      "anual": {
        "moeda": "USD",
        "centavos": 15790
      }
    },
    "CR": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1890
      },
      "anual": {
        "moeda": "USD",
        "centavos": 18790
      }
    },
    "PA": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1890
      },
      "anual": {
        "moeda": "USD",
        "centavos": 18790
      }
    },
    "ES": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 2190
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 21790
      }
    },
    "PT": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 2190
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 21790
      }
    },
    "DE": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 2490
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 24790
      }
    },
    "FR": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 2490
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 24790
      }
    },
    "US": {
      "mensal": {
        "moeda": "USD",
        "centavos": 2490
      },
      "anual": {
        "moeda": "USD",
        "centavos": 24790
      }
    }
  },
  "equipe": {
    "PY": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1990
      },
      "anual": {
        "moeda": "USD",
        "centavos": 19790
      }
    },
    "BO": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1990
      },
      "anual": {
        "moeda": "USD",
        "centavos": 19790
      }
    },
    "HN": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1990
      },
      "anual": {
        "moeda": "USD",
        "centavos": 19790
      }
    },
    "NI": {
      "mensal": {
        "moeda": "USD",
        "centavos": 1990
      },
      "anual": {
        "moeda": "USD",
        "centavos": 19790
      }
    },
    "CO": {
      "mensal": {
        "moeda": "USD",
        "centavos": 2490
      },
      "anual": {
        "moeda": "USD",
        "centavos": 24790
      }
    },
    "AR": {
      "mensal": {
        "moeda": "USD",
        "centavos": 2490
      },
      "anual": {
        "moeda": "USD",
        "centavos": 24790
      }
    },
    "PE": {
      "mensal": {
        "moeda": "USD",
        "centavos": 2490
      },
      "anual": {
        "moeda": "USD",
        "centavos": 24790
      }
    },
    "GT": {
      "mensal": {
        "moeda": "USD",
        "centavos": 2490
      },
      "anual": {
        "moeda": "USD",
        "centavos": 24790
      }
    },
    "SV": {
      "mensal": {
        "moeda": "USD",
        "centavos": 2490
      },
      "anual": {
        "moeda": "USD",
        "centavos": 24790
      }
    },
    "BZ": {
      "mensal": {
        "moeda": "USD",
        "centavos": 2490
      },
      "anual": {
        "moeda": "USD",
        "centavos": 24790
      }
    },
    "MX": {
      "mensal": {
        "moeda": "USD",
        "centavos": 2990
      },
      "anual": {
        "moeda": "USD",
        "centavos": 29790
      }
    },
    "CL": {
      "mensal": {
        "moeda": "USD",
        "centavos": 2990
      },
      "anual": {
        "moeda": "USD",
        "centavos": 29790
      }
    },
    "CR": {
      "mensal": {
        "moeda": "USD",
        "centavos": 3490
      },
      "anual": {
        "moeda": "USD",
        "centavos": 34790
      }
    },
    "PA": {
      "mensal": {
        "moeda": "USD",
        "centavos": 3490
      },
      "anual": {
        "moeda": "USD",
        "centavos": 34790
      }
    },
    "ES": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 3990
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 39790
      }
    },
    "PT": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 3990
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 39790
      }
    },
    "DE": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 4490
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 44690
      }
    },
    "FR": {
      "mensal": {
        "moeda": "EUR",
        "centavos": 4490
      },
      "anual": {
        "moeda": "EUR",
        "centavos": 44690
      }
    },
    "US": {
      "mensal": {
        "moeda": "USD",
        "centavos": 4490
      },
      "anual": {
        "moeda": "USD",
        "centavos": 44690
      }
    }
  }
} as Tabela

/** Valores aprovados somente para simulacao/publicidade local da America do Sul.
 * Brasil conserva o valor BRL recebido de planos.ts; cobranca real nao usa esta tabela.
 * Paddle Sandbox ainda pode divergir; checkout internacional permanece bloqueado.
 */
const PAISES_AMERICA_SUL_USD = new Set<string>(['PY', 'BO', 'AR', 'CL', 'CO', 'EC', 'GY', 'PE', 'SR', 'UY'])
const PRECOS_AMERICA_SUL_USD: Record<Exclude<PlanoRegional, 'free'>, Record<BillingCycle, Preco>> = {
  minipage: { mensal: { moeda: 'USD', centavos: 590 }, anual: { moeda: 'USD', centavos: 5890 } },
  agenda: { mensal: { moeda: 'USD', centavos: 790 }, anual: { moeda: 'USD', centavos: 7890 } },
  loja: { mensal: { moeda: 'USD', centavos: 990 }, anual: { moeda: 'USD', centavos: 9890 } },
  essencial: { mensal: { moeda: 'USD', centavos: 1190 }, anual: { moeda: 'USD', centavos: 11890 } },
  equipe: { mensal: { moeda: 'USD', centavos: 2990 }, anual: { moeda: 'USD', centavos: 29790 } },
}

const VALIDOS = new Set<string>(PAISES_REGIONAIS)
export function normalizarPaisRegional(valor: unknown): PaisRegional {
  if (typeof valor !== 'string') return 'OUTROS'
  const pais = valor.trim().toUpperCase()
  return VALIDOS.has(pais) ? pais as PaisRegional : 'OUTROS'
}
/** A landing reflete apenas precos V1 disponiveis no catalogo Stripe Live.
 * Essa consulta NAO autoriza cobranca; o checkout valida pais/plano no servidor.
 * A tabela historica Paddle acima fica inativa na apresentacao publica.
 */
export function precoRegional(plano: PlanoRegional, ciclo: BillingCycle, pais: PaisRegional,
  precoBrasil: number): {moeda: 'BRL' | 'USD' | 'EUR'; centavos: number} | null {
  void precoBrasil // parametro conservado para compatibilidade das chamadas existentes
  if (plano === 'free') {
    return { moeda: pais === 'BR' || pais === 'OUTROS' ? 'BRL' : ['PT','ES','FR','DE'].includes(pais) ? 'EUR' : 'USD', centavos: 0 }
  }
  if (pais === 'OUTROS' || plano === 'equipe') return null
  const aprovado = consultarPrecoAprovadoV1(plano, ciclo, pais)
  return aprovado ? { moeda: aprovado.currency, centavos: aprovado.amountMinor } : null
}
export function mostrarPrecoRegional(preco: {moeda: string;centavos: number}|null, idioma: Idioma): string {
  if (!preco) return '—'
  return new Intl.NumberFormat(idioma,{style:'currency',currency:preco.moeda,minimumFractionDigits:2,maximumFractionDigits:2}).format(preco.centavos/100)
}
export function nomePaisRegional(pais: PaisRegional, idioma: Idioma): string {
  if (pais==='OUTROS') return 'Other / Outros'
  try { return new Intl.DisplayNames([idioma],{type:'region'}).of(pais) || pais }
  catch { return pais }
}
export const TEXTOS_PRECOS: Record<Idioma, {
  pais:string; dica:string; auto:string; escolha:string; aviso:string; indisponivel:string;
  inicio:string; semFidelidade:string; referencia:string; gratuito:string; selecionarPais:string; buscarPais:string; precoEmPreparacao:string; semResultados:string; paisesListados:string
}> = {
 'pt-BR':{pais:'País / região dos preços',dica:'Idioma e país de cobrança são independentes. Confira o país antes de contratar.',auto:'País sugerido automaticamente; você pode alterá-lo.',escolha:'País escolhido manualmente.',aviso:'Os preços internacionais são de referência. A cobrança internacional ainda não está disponível; o valor final será confirmado no checkout autorizado.',indisponivel:'Contratação internacional indisponível',inicio:'Planos pagos a partir de',semFidelidade:'por mês, sem fidelidade.',referencia:'Preço regional de referência',gratuito:'Grátis',selecionarPais:"Selecione seu país",buscarPais:"Buscar país pelo nome ou código",precoEmPreparacao:"Preço em preparação",semResultados:"Nenhum país encontrado",paisesListados:"Países disponíveis na pesquisa"},
 'en-US':{pais:'Pricing country / region',dica:'Language and billing country are independent. Check your country before subscribing.',auto:'Country suggested automatically; you can change it.',escolha:'Country selected manually.',aviso:'International prices are for reference only. International checkout is not yet available; the final charge will be confirmed at an authorized checkout.',indisponivel:'International checkout unavailable',inicio:'Paid plans start at',semFidelidade:'per month, no long-term commitment.',referencia:'Regional reference price',gratuito:'Free',selecionarPais:"Select your country",buscarPais:"Search by country or code",precoEmPreparacao:"Pricing coming soon",semResultados:"No countries found",paisesListados:"Countries available to search"},
 'es-ES':{pais:'País / región de precios',dica:'El idioma y el país de facturación son independientes. Comprueba tu país antes de contratar.',auto:'País sugerido automáticamente; puedes cambiarlo.',escolha:'País elegido manualmente.',aviso:'Los precios internacionales son orientativos. Los pagos internacionales aún no están disponibles; el importe final se confirmará en el pago autorizado.',indisponivel:'Contratación internacional no disponible',inicio:'Planes de pago desde',semFidelidade:'al mes, sin permanencia.',referencia:'Precio regional orientativo',gratuito:'Gratis',selecionarPais:"Selecciona tu país",buscarPais:"Busca por país o código",precoEmPreparacao:"Precios en preparación",semResultados:"No se encontraron países",paisesListados:"Países disponibles para buscar"},
 'fr-FR':{pais:'Pays / région des tarifs',dica:'La langue et le pays de facturation sont indépendants. Vérifiez votre pays avant de souscrire.',auto:'Pays suggéré automatiquement ; vous pouvez le modifier.',escolha:'Pays sélectionné manuellement.',aviso:'Les tarifs internationaux sont indicatifs. Le paiement international n’est pas encore disponible ; le montant final sera confirmé lors du paiement autorisé.',indisponivel:'Paiement international indisponible',inicio:'Offres payantes à partir de',semFidelidade:'par mois, sans engagement de durée.',referencia:'Prix régional indicatif',gratuito:'Gratuit',selecionarPais:"Sélectionnez votre pays",buscarPais:"Rechercher un pays ou un code",precoEmPreparacao:"Tarifs en préparation",semResultados:"Aucun pays trouvé",paisesListados:"Pays disponibles à la recherche"},
 'de-DE':{pais:'Land / Preisregion',dica:'Sprache und Abrechnungsland sind unabhängig. Prüfen Sie Ihr Land vor dem Kauf.',auto:'Land automatisch vorgeschlagen; Sie können es ändern.',escolha:'Land manuell ausgewählt.',aviso:'Internationale Preise dienen nur zur Orientierung. Internationale Zahlungen sind noch nicht verfügbar; der endgültige Betrag wird beim freigegebenen Checkout bestätigt.',indisponivel:'Internationaler Checkout nicht verfügbar',inicio:'Kostenpflichtige Tarife ab',semFidelidade:'pro Monat, ohne langfristige Bindung.',referencia:'Regionaler Richtpreis',gratuito:'Kostenlos',selecionarPais:"Wählen Sie Ihr Land",buscarPais:"Nach Land oder Code suchen",precoEmPreparacao:"Preise in Vorbereitung",semResultados:"Keine Länder gefunden",paisesListados:"Länder in der Suche verfügbar"},
 'it-IT':{pais:'Paese / area prezzi',dica:'Lingua e paese di fatturazione sono indipendenti. Verifica il paese prima di abbonarti.',auto:'Paese suggerito automaticamente; puoi modificarlo.',escolha:'Paese scelto manualmente.',aviso:'I prezzi internazionali sono indicativi. I pagamenti internazionali non sono ancora disponibili; l’importo finale sarà confermato al checkout autorizzato.',indisponivel:'Pagamento internazionale non disponibile',inicio:'Piani a pagamento da',semFidelidade:'al mese, senza vincolo a lungo termine.',referencia:'Prezzo regionale indicativo',gratuito:'Gratis',selecionarPais:"Seleziona il tuo paese",buscarPais:"Cerca paese o codice",precoEmPreparacao:"Prezzi in preparazione",semResultados:"Nessun paese trovato",paisesListados:"Paesi disponibili nella ricerca"},
}
