from app.baserow_client import baserow_client
from datetime import datetime, timedelta

# Testes Unitários de Lógica de Negócio e Processamento de Dados

def test_processamento_numero_telefone_limpo():
    """Testa se remove caracteres não numéricos"""
    # Arrange
    raw = "+55 (11) 98888-7777"
    expected_suffix = "88887777" # _get_search_key retorna last 8
    
    # Act
    result = baserow_client._get_search_key(raw)
    
    # Assert
    assert result == expected_suffix

def test_processamento_numero_telefone_curto():
    """Testa numero curto (menos de 8 digitos)"""
    raw = "12345"
    result = baserow_client._get_search_key(raw)
    assert result == "12345"

def test_processamento_numero_none():
    """Testa input None"""
    result = baserow_client._get_search_key(None)
    assert result == ""

def test_mapeamento_janela_24h_ativa():
    """Testa se o mapper converte corretamente o booleano do Baserow"""
    # Arrange
    mock_row = {
        "id": 1,
        "Nome": "Teste",
        "Janela de 24 Horas": True,
        "Ultimo Horario Que Trocamos Mensagens": "2023-01-01T10:00:00"
    }
    
    # Act
    cliente_dict = baserow_client._map_from_baserow_fields(mock_row)
    
    # Assert
    assert cliente_dict["janela_24_horas"] is True
    assert cliente_dict["ultimo_horario_mensagens"] == "2023-01-01T10:00:00"

def test_mapeamento_janela_24h_inativa():
    """Testa se o mapper converte corretamente quando False"""
    mock_row = {
        "id": 2,
        "Nome": "Teste 2",
        "Janela de 24 Horas": False
    }
    
    cliente_dict = baserow_client._map_from_baserow_fields(mock_row)
    
    assert cliente_dict["janela_24_horas"] is False

def test_logica_calculo_janela_auxiliar():
    """
    Testa uma função auxiliar hipotética para validar a janela de 24h
    Isso simula a lógica que o Backend usaria se não confiasse no Baserow
    """
    def is_within_24h(last_msg_str: str) -> bool:
        if not last_msg_str:
            return False
        try:
            last_msg = datetime.fromisoformat(last_msg_str)
            now = datetime.now()
            # Simulando que 'now' é logo após
            limit = last_msg + timedelta(hours=24)
            return now < limit
        except:
            return False

    # Mock Data dentro da janela
    agora = datetime.now()
    uma_hora_atras = (agora - timedelta(hours=1)).isoformat()
    
    # Mock Data fora da janela
    vinte_cinco_horas_atras = (agora - timedelta(hours=25)).isoformat()

    assert is_within_24h(uma_hora_atras) is True
    assert is_within_24h(vinte_cinco_horas_atras) is False
